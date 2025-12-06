const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if needed
const Seller = require('../models/Seller'); // Adjust path if needed
const router = express.Router();
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 's';

// Middleware: Authenticate JWT token from Authorization header
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']; // lowercase 'authorization'
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  console.log('Received token:', token);

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Erreur JWT:', err);
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = decoded; // e.g. { userId, role }
    next();
  });
}

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { nom, email, password, adresse, telephone, dateNaissance } = req.body;
    
    // Add validation
    if (!nom || !email || !password || !dateNaissance) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already in use' 
      });
    }

    // Hash password with salt rounds (10 is a good default)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      nom,
      email,
      password: hashedPassword,
      role: 'client',
      adresse: adresse || null,
      telephone: telephone || null,
      dateNaissance: new Date(dateNaissance),
      avatar: 'https://www.gravatar.com/avatar/default?d=mp'
    });

    await newUser.save();

    // Create token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: { $regex: new RegExp(email, 'i') } });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    console.log('User found, hashed password:', user.password);

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      userType: user.role,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});


// Protected route to get current user info
router.get('/me', authenticateToken, async (req, res) => {
  // You can just reuse the existing logic or call the same handler internally
  const user = await User.findById(req.user.userId)
    .select('-password -__v')
    .lean();

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const profileData = {
    _id: user._id,
    nom: user.nom,
    email: user.email,
    telephone: user.telephone || 'Not provided',
    adresse: user.adresse || 'Not provided',
    dateNaissance: user.dateNaissance ? new Date(user.dateNaissance).toLocaleDateString() : 'Not provided',
    totalOrders: user.orders?.length || 0
  };

  res.json({ success: true, user: profileData });
});
router.put('/:id/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(userId, { preferences }, { new: true });

    // ✅ Optional: Notify user if email notification turned ON
    if (preferences.notifications?.email) {
      await sendNotificationEmail(
        user.email,
        'Email notifications enabled',
        `<p>Hello ${user.nom},</p><p>You have enabled email notifications.</p>`
      );
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.userId !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur mis à jour avec succès', user: updatedUser });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// Change password route (protected)
router.post('/:id/change-password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user.userId !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe actuel incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    let user = await User.findOne({ email });
    let userType = 'client';

    if (!user) {
      user = await Seller.findOne({ email });
      userType = 'vendeur';
    }

    if (!user) {
      return res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
    }

    const secret = process.env.JWT_SECRET || 'default_secret';

    const resetToken = jwt.sign(
      { userId: user._id, role: userType },
      secret,
      { expiresIn: '1h' }
    );

    const resetUrl = `http://localhost:4200/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Link',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`
    });

    res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error while processing forgot password', error: err.message });
  }
});
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 's');
    const { userId, role } = decoded;

    const userModel = role === 'vendeur' ? Seller : User;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(400).json({ message: 'Lien expiré ou invalide' });
  }
});
// Add these routes to your existing user routes file

// Get user orders
router.get('/:id/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// Get user wishlist
router.get('/:id/wishlist', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('wishlist');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add to wishlist
router.post('/:id/wishlist', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    await User.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { wishlist: productId } },
      { new: true }
    );
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove from wishlist
router.delete('/:id/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { wishlist: req.params.productId } },
      { new: true }
    );
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// Update user preferences
router.put('/:userId/preferences', async (req, res) => {
  const { userId } = req.params;
  const { preferences } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { preferences },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error updating preferences:', err);
    res.status(500).json({ success: false, message: 'Server error updating preferences' });
  }
});
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Ne retourne pas le mot de passe
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.get('/only-customers', async (req, res) => {
  try {
    const customers = await User.find({ role: 'client' }).select('-password');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// Supprimer un utilisateur (admin uniquement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Seul un admin peut supprimer
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/:id/deactivate', authenticateToken, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ success: true, message: 'Account deactivated' });
});
router.put('/:id', authenticateToken, async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
  res.json({ message: 'Utilisateur mis à jour avec succès', user });
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User account deleted successfully' });
});
module.exports = router;
