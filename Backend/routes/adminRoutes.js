const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Seller = require('../models/Seller');    // Vendeur
const Admin = require('../models/admin'); // <-- À AJOUTER
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth'); // ✅ Assure-toi que le chemin est correct
const Product = require('../models/product');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const FlashSale = require('../models/FlashSale');
const multer = require('multer');
const path = require('path');

// Configurer le stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // dossier où seront enregistrées les images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Dans admin.routes.js

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Tentative login - email:', email, 'password:', password); // 🔍

    // 1. Vérifier l'admin
const admin = await Admin.findOne({ email }).select('+password');
console.log('Mot de passe reçu:', JSON.stringify(password));
console.log('Hash en base:', admin.password);


    if (!admin) {
            console.log('❌ Admin non trouvé');

      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
    console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    console.log('JWT_SECRET:', process.env.JWT_SECRET);


    // 3. Générer le token JWT
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 4. Mettre à jour la dernière connexion
    admin.dateDerniereConnexion = new Date();
    await admin.save();

    // 5. Retourner la réponse
    res.json({
      token,
      admin: {
        id: admin._id,
        nom: admin.nom,
        prenom: admin.prenom, 
        email: admin.email,
        telephone: admin.telephone,
        role: admin.role,
        avatar: admin.avatar,
          createdAt: admin.createdAt // Pour "Membre depuis"

      }
    });

  } catch (error) {
    console.error('Erreur connexion admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
})
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [users, sellers, products, orders, revenue] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { 
          $group: { 
            _id: null, 
            total: { $sum: "$total" } 
          } 
        }
      ])
    ]);

    res.json({
      totalUsers: users + sellers,
      totalProducts: products,
      totalOrders: orders,
      totalRevenue: revenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Erreur dashboard-stats:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la récupération des statistiques' 
    });
  }
});


router.get('/user-growth', async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = users.map(u => ({
      date: monthNames[u._id - 1],
      count: u.count
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Erreur chargement user-growth', err });
  }
});
router.put('/profile', auth, async (req, res) => {
  try {
    const adminId = req.adminId;
    console.log('adminId reçu:', adminId);

    const {
      nom,
      prenom,
      email,
      telephone,
      adresse,
      dateNaissance,
      oldPassword,
      newPassword
    } = req.body;

    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin non trouvé' });
    }

    if (oldPassword && newPassword) {
      const match = await bcrypt.compare(oldPassword, admin.password);
      if (!match) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
      }

      admin.password = newPassword; // sera hashé automatiquement par pre-save
    }

    admin.nom = nom;
    admin.prenom = prenom;
    admin.email = email;
    admin.telephone = telephone;
    admin.adresse = adresse;
    admin.dateNaissance = dateNaissance;

    await admin.save();

    res.json({ message: 'Profil mis à jour', admin });

  } catch (error) {
    console.error("Erreur serveur dans /profile:", error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
router.get('/sales-data', async (req, res) => {
  try {
    // Obtenir les données de vente des 12 derniers mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: { $ne: 'cancelled' } // Exclure les commandes annulées
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalAmount: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { 
        $sort: { "_id.year": 1, "_id.month": 1 } 
      }
    ]);

    // Formater les données pour le frontend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = salesData.map(item => ({
      date: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      amount: item.totalAmount,
      count: item.count
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ message: 'Error fetching sales data', error: error.message });
  }
});
router.delete('/products/:id', auth, async (req, res) => {
    console.log('Role reçu dans DELETE produit:', req.role);

  try {
    // Vérification renforcée du rôle admin
     if (req.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin privileges required' 
      });
    }

    // Vérification de l'existence du produit
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    // Vérification des commandes en cours
    const pendingOrders = await Order.countDocuments({
      'products.product': req.params.id,
      status: { $nin: ['delivered', 'cancelled'] }
    });

    if (pendingOrders > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer - produit dans des commandes actives'
      });
    }

    // Suppression effective
    await Product.findByIdAndDelete(req.params.id);

    // Suppression du fichier image si existant
    if (product.image) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../uploads', product.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ success: true });
    
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// Changer le mot de passe
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const adminId = req.adminId; // ✅ Récupère l'ID depuis le middleware
    const admin = await Admin.findById(adminId).select('+password');

    if (!admin) {
      return res.status(404).json({ message: 'Admin non trouvé' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    admin.password = newPassword; // ✅ En clair, car mongoose va le hasher
    await admin.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
router.get('/all-users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const sellers = await Seller.find().select('-password');
    // Add type field to distinguish
    const all = [
      ...users.map(u => ({ ...u.toObject(), type: 'client' })),
      ...sellers.map(s => ({ ...s.toObject(), type: 'vendeur' }))
    ];
    res.json(all);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// DELETE SELLER
router.delete('/sellers/:id', auth, async (req, res) => {
  try {
    // Vérification du rôle admin
    if (req.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin privileges required'
      });
    }

    // Vérifier si le vendeur existe
    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      return res.status(404).json({ message: 'Vendeur introuvable' });
    }

    // Vérifier si le vendeur a encore des produits actifs
    const productsCount = await Product.countDocuments({ seller: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer - ce vendeur a encore des produits actifs'
      });
    }

    // Vérifier si le vendeur a encore des commandes actives
    const pendingOrders = await Order.countDocuments({
      'products.seller': req.params.id,
      status: { $nin: ['delivered', 'cancelled'] }
    });
    if (pendingOrders > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer - ce vendeur a encore des commandes actives'
      });
    }

    // Suppression du vendeur
    await Seller.findByIdAndDelete(req.params.id);

    // Suppression de la photo de profil si elle existe
    if (seller.image) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../uploads', seller.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Erreur suppression vendeur:', error);
    res.status(500).json({
      message: 'Erreur serveur',
      error: error.message
    });
  }
});
router.delete('/users/:id', auth, async (req, res) => {
  try {
    // Vérification du rôle admin (adapter selon ta gestion des rôles)
    if (req.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Suppression utilisateur
    await User.findByIdAndDelete(req.params.id);

    // Tu peux ajouter suppression fichiers liés ici si besoin (ex: avatar)

    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
// GET all orders (admin only)
router.get('/orders', auth, async (req, res) => {
  try {
    // Vérification du rôle admin
    if (req.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    // Récupérer toutes les commandes
    const orders = await Order.find()
      .populate('products.product')  // optionnel : pour avoir les détails du produit
      .populate('products.seller');  // optionnel : pour avoir les infos du vendeur

    res.json({ orders }); // renvoie { orders: [...] } pour Angular
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ROUTE TEMPORAIRE pour créer le premier admin (non protégée)
router.post('/admins-init', async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone } = req.body;

    // Vérifier si un admin avec ce mail existe déjà
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const admin = new Admin({ nom, prenom, email, password, telephone, role: 'admin' });
    await admin.save();

    // Retirer le mot de passe de la réponse
    const { password: pwd, ...adminData } = admin.toObject();
    res.status(201).json(adminData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
// Lister toutes les catégories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().populate('subcategories');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
router.post('/categories', auth, upload.single('image'), async (req, res) => {
    try {
        if (req.role !== 'admin') return res.status(403).json({ message: 'Admin privileges required' });

        const { name, description } = req.body;
        const image = req.file ? req.file.filename : null;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
        }

        const existingCategory = await Category.findOne({ name: name.trim() });
        if (existingCategory) {
            return res.status(409).json({ message: 'Cette catégorie existe déjà.' });
        }

        const newCategory = new Category({
            name: name.trim(),
            description: description || '',
            image // ← enregistrer le nom du fichier
        });

        await newCategory.save();

        res.status(201).json({ message: 'Catégorie ajoutée avec succès', category: newCategory });
    } catch (error) {
        console.error('Erreur création catégorie:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

router.post('/subcategories', auth, async (req, res) => {
  try {
    const { name, categoryId } = req.body;
    // ⚡ Utiliser le nom exact de l'import
    const subCategory = await Subcategory.create({ name, category: categoryId });

    // Optionnel : ajouter l'id de subCategory dans Category
    const category = await Category.findById(categoryId);
    category.subcategories.push(subCategory._id);
    await category.save();

    res.status(201).json(subCategory);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
// DELETE CATEGORY
router.delete('/categories/:id', auth, async (req, res) => {
  try {
    // Vérification du rôle admin
    if (req.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    // Vérifier si la catégorie existe
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Catégorie introuvable' });
    }

    // Supprimer toutes les sous-catégories liées
    await Subcategory.deleteMany({ category: req.params.id });

    // Vérifier si des produits utilisent cette catégorie
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer - cette catégorie est utilisée par des produits'
      });
    }

    // Supprimer la catégorie
    await Category.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Catégorie et ses sous-catégories supprimées avec succès' });

  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


// routes/admin.js (ou ton fichier de routes catégories)
router.delete(
  "/categories/:categoryId/subcategories/:subCategoryId",auth,async (req, res) => {
    try {
      const { categoryId, subCategoryId } = req.params;

      // Cherche la catégorie
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Supprime la sous-catégorie
      category.subcategories = category.subcategories.filter(
        (sub) => sub._id.toString() !== subCategoryId
      );

      await category.save();

      res.json({ message: "Subcategory deleted successfully" });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({ message: "Error deleting subcategory" });
    }
  }
);

router.get('/flashsales', async (req, res) => {
  try {
    const flashSales = await FlashSale.find().sort({ createdAt: -1 });
    res.json(flashSales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post('/flashsales', auth, async (req, res) => {
  try {
    if (req.role !== 'admin') return res.status(403).json({ message: 'Admin privileges required' });

    const { title, description, startDate, endDate, discount,isHighlighted } = req.body;
    const flashSale = new FlashSale({ title, description, startDate, endDate, discount ,isHighlighted});
    await flashSale.save();

    res.json({ success: true, flashSale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/flashsales/:id', auth, async (req, res) => {
  try {
    const { title, description, startDate, endDate, discount, isHighlighted } = req.body;
    
    const flashSale = await FlashSale.findByIdAndUpdate(
      req.params.id,
      { title, description, startDate, endDate, discount, isHighlighted },
      { new: true, runValidators: true }
    );

    res.json({ success: true, flashSale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.delete('/flashsales/:id', auth, async (req, res) => {
  try {
    await FlashSale.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
