require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

// 📦 Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

// 🌍 CORS
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json()); // <-- DOIT être avant les routes
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`➡️ Requête reçue : ${req.method} ${req.url}`);
  console.log('Content-Type:', req.headers['content-type']);
  next();
});
// 🔀 Routes

const userRoutes = require('./routes/users');
const sellerRoutes = require('./routes/sellers');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/Order');
const stripeRoutes = require('./routes/stripe');
const wishlistRoutes = require('./routes/wishlist');
const adminRoutes = require('./routes/adminRoutes');
const ratingRoutes = require('./routes/ratingRoute');
app.use('/api', productRoutes);
// 📡 Register routes

app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api', categoryRoutes);
app.use('/api', subcategoryRoutes);
 // Inclut l'upload image
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sellers/rating', ratingRoutes);

// 🔌 DB Connection
mongoose.connect('mongodb://localhost:27017/Shop')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ⚠️ Global error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'FILE_UPLOAD_ERROR', message: err.message });
  }
  console.error(err.stack);
  res.status(500).send('Server Error');
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
