const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');  // IMPORTANT: import jwt
const Seller = require('../models/Seller');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Rating = require('../models/rating'); // import this in seller route
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// Assure-toi que le dossier uploads existe
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuration multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Signup vendeur avec upload fichiers
router.post('/signup', upload.fields([
  { name: 'documentation', maxCount: 1 },
  { name: 'storePhoto', maxCount: 1 }
]), async (req, res) => {
  console.log("📝 req.files:", req.files);

  if (!req.files || !req.files.documentation || !req.files.storePhoto) {
    return res.status(400).json({ message: 'Les fichiers documentation et storePhoto sont requis' });
  }

  try {
    const {
      nom, email, password,
      adresse, telephone, dateNaissance,
      businessName, productType, description
    } = req.body;

    if (!nom || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSeller = new Seller({
      nom,
      email,
      password: hashedPassword,
      adresse,
      telephone,
      dateNaissance,
      boutique: {
        businessName,
        productType,
        description,
        documentation: req.files.documentation[0].path,
        storePhoto: req.files.storePhoto[0].path
      }
    });

    await newSeller.save();
    res.status(201).json({ message: 'Vendeur enregistré avec succès', seller: newSeller });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Login vendeur
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Informations de connexion invalides' });
    }

    const secret = process.env.JWT_SECRET || 's';
    const token = jwt.sign(
      { userId: seller._id, role: 'vendeur' },
      secret,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: seller.toObject()
    });

  } catch (error) {
    console.error('Erreur serveur login vendeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur pendant la connexion du vendeur' });
  }
});


const authenticate = require('../middleware/auth');

router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const sellerId = req.params.id;
    const userId = req.user._id; // from auth middleware
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    let existingRating = await Rating.findOne({ seller: sellerId, user: userId });

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();
    } else {
      existingRating = new Rating({ seller: sellerId, user: userId, rating, comment });
      await existingRating.save();
    }

    const ratings = await Rating.find({ seller: sellerId });
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await Seller.findByIdAndUpdate(sellerId, { 'boutique.rating': avgRating });

    res.status(200).json({ message: 'Rating saved', averageRating: avgRating });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving rating' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json(seller);
  } catch (error) {
    console.error('Error fetching seller by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
const Product = require('../models/product');


router.get('/', async (req, res) => {
  try {
    const sellers = await Seller.find();
    const sellersWithRating = await Promise.all(sellers.map(async seller => {
      const ratings = await Rating.find({ seller: seller._id });
      const avgRating = ratings.length
        ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
        : 0;
      return {
        ...seller.toObject(),
        rating: avgRating,
        products: await Product.countDocuments({ seller: seller._id })
      };
    }));

    res.json(sellersWithRating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching sellers' });
  }
});

// Seller Dashboard
router.get('/dashboard/:id', authenticate, async (req, res) => {
  try {
    const sellerId = req.params.id;

    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const totalProducts = await Product.countDocuments({ seller: sellerId });

    // Find all orders that include products from this seller
    const orders = await Order.find({ "products.sellerId": sellerId }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    let pendingOrders = 0;
    let completedOrders = 0;

    // Build recentOrders with only this seller's products
    const recentOrders = orders.slice(0, 5).map(order => {
      const sellerProducts = order.products.filter(p => p.sellerId.toString() === sellerId);
      
      // Count order status for this seller
      if (sellerProducts.length > 0) {
        if (order.status === 'delivered') completedOrders++;
        else if (order.status === 'pending') pendingOrders++;
      }

      return {
        orderId: order._id,
        customer: order.userId, // populate if needed
        products: sellerProducts,
        total: sellerProducts.reduce((sum, p) => sum + p.price * p.quantity, 0),
        status: order.status,
        date: order.createdAt
      };
    });

    // Average rating
    const ratings = await Rating.find({ seller: sellerId });
    const avgRating = ratings.length
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    res.json({
      seller: {
        id: seller._id,
        name: seller.nom,
        boutique: seller.boutique?.businessName || 'N/A'
      },
      stats: {
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        averageRating: avgRating.toFixed(2)
      },
      recentOrders
    });

  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    res.status(500).json({ message: 'Server error fetching seller dashboard' });
  }
});


router.get("/:sellerId/customers", async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Find all orders that contain this seller's products
    const orders = await Order.find({ "products.sellerId": sellerId })
      .populate("userId", "nom email") // make sure this matches your User schema
      .exec();

    // Map customers by userId
    const customerMap = {};

    orders.forEach((order) => {
      if (!order.userId) return; // skip if user is missing
      const userId = order.userId._id.toString();
      if (!customerMap[userId]) {
        customerMap[userId] = {
          _id: userId,
          name: order.userId.nom || order.userId.name || "Client inconnu",
          email: order.userId.email || "",
          orderCount: 0,
        };
      }
      customerMap[userId].orderCount += 1;
    });

    const customers = Object.values(customerMap);

    res.json({ success: true, customers });
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put('/update/:id', authMiddleware, upload.single('storePhoto'), async (req, res) => {
  try {
    const { nom, email, boutique } = req.body;
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    // Update basic fields
    seller.nom = nom || seller.nom;
    seller.email = email || seller.email;

    // Update boutique safely
    if (boutique) {
  let boutiqueObj;
  try {
    boutiqueObj = typeof boutique === 'string' ? JSON.parse(boutique) : boutique;
  } catch (err) {
    console.error("Error parsing boutique:", err);
    return res.status(400).json({ message: 'Invalid boutique format' });
  }

  // Merge boutique fields mais seulement si la valeur existe
 if (boutiqueObj) {
  seller.boutique = {
    ...seller.boutique,
    businessName: boutiqueObj.businessName || seller.boutique.businessName,
    productType: boutiqueObj.productType || seller.boutique.productType,
    description: boutiqueObj.description || seller.boutique.description
  };
}

// Update storePhoto if uploaded
if (req.file) {
  seller.boutique.storePhoto = req.file.path;
}

await seller.save();

}


    // Update storePhoto if uploaded
    if (req.file) {
      seller.boutique.storePhoto = req.file.path;
    }

    await seller.save();
    res.json({ message: 'Seller updated successfully', seller });
  } catch (err) {
    console.error('Error updating seller:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;