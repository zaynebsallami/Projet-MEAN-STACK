const Cart = require('../models/cartItemSchema');
const Product = require('../models/product');

// Get current user's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.json({ items: [] });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error });
  }
};

// Add or update item in cart
exports.addOrUpdateItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    cart.updatedAt = Date.now();
    await cart.save();

    const populatedCart = await cart.populate('items.product').execPopulate();

    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error });
  }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    cart.updatedAt = Date.now();

    await cart.save();

    const populatedCart = await cart.populate('items.product').execPopulate();

    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Error removing item', error });
  }
};
