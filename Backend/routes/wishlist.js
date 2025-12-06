const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth'); // your auth middleware

// Get current user's wishlist with populated product details
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get wishlist', error });
  }
});

// Add a product to wishlist
router.post('/add/:productId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }
    res.json({ message: 'Product added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add product', error });
  }
});

// Remove a product from wishlist
router.delete('/remove/:productId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
    await user.save();
    res.json({ message: 'Product removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove product', error });
  }
});

module.exports = router;
