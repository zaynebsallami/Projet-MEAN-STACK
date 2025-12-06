const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth'); // Make sure you have JWT auth middleware
const Product = require('../models/product');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { products, total, shippingAddress, paymentMethod } = req.body;

    const enrichedProducts = await Promise.all(products.map(async (item) => {
      if (!item.sellerId) {
        const product = await Product.findById(item.productId).select('seller');
        if (!product) throw new Error(`Product ${item.productId} not found`);
        return { ...item, sellerId: product.seller };
      }
      return item;
    }));

    const newOrder = new Order({
      userId: req.user.userId,
      products: enrichedProducts,
      total,
      shippingAddress,
      paymentMethod,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({ success: true, order: savedOrder });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create order' });
  }
});
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    const orders = await Order.find({ "products.sellerId": sellerId })
      .populate('userId', 'name email')
      .populate('products.productId')
      .sort({ createdAt: -1 });

    // Ajouter le totalAmount pour chaque commande
    const ordersWithTotal = orders.map(order => {
      const totalAmount = order.products.reduce((sum, p) => {
        return sum + (p.price * p.quantity);
      }, 0);

      return {
        ...order._doc,
        totalAmount
      };
    });

    res.json({ success: true, orders: ordersWithTotal });
  } catch (err) {
    console.error('Erreur lors du fetch des commandes vendeur :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Ajoutez cette nouvelle route AVANT les autres routes GET
router.get('/stats/:sellerId', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    // 1. Nombre de produits du vendeur
    const productCount = await Product.countDocuments({ seller: sellerId });

    // 2. Récupérer les commandes du vendeur
    const orders = await Order.find({ "products.sellerId": sellerId });

    // 3. Calculer le revenu total
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);

    // 4. Nombre de clients uniques
    const customerIds = [...new Set(orders.map(o => o.userId.toString()))];
    const customerCount = customerIds.length;

    // 5. Calcul de croissance (simplifié)
    const growth = orders.length > 0 ? 10 : 0; // Exemple basique

    res.json({
      productCount,
      revenue,
      customerCount,
      growth
    });

  } catch (err) {
    console.error('Error in seller stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validez le statut
    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error('Erreur de mise à jour du statut:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
// Place this ABOVE /:id
router.get('/user/:id', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.id })
      .populate('products.productId','_id name image') // populate product details inside products array
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// Ajoutez cette route avant les autres routes GET
router.get('/monthly-sales/:sellerId', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const currentYear = new Date().getFullYear();
    
    const monthlySales = await Order.aggregate([
      { 
        $match: { 
          "products.sellerId": sellerId,
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        } 
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalSales: { $sum: "$total" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          month: "$_id",
          totalSales: 1,
          orderCount: 1,
          _id: 0
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Formattez les données pour inclure tous les mois
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const formattedSales = allMonths.map(month => {
      const found = monthlySales.find(s => s.month === month);
      return {
        month,
        totalSales: found ? found.totalSales : 0,
        orderCount: found ? found.orderCount : 0
      };
    });

    res.json({
      success: true,
      monthlySales: formattedSales
    });
  } catch (err) {
    console.error('Error fetching monthly sales:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email avatar') // Peuple l'utilisateur avec les champs nécessaires
      .populate('products.productId', 'name price images') // Correction ici: productId au lieu de product
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      orders 
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des commandes' 
    });
  }
});
// Keep this AFTER /user/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('products.productId');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, order });
  } catch (err) {
    console.error('Fetch order failed:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

module.exports = router;
