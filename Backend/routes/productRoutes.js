const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/product');
const productController = require('../controllers/productController');

// Config Multer (à déplacer ici si pas global)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });
// ➕ Ajouter un produit
router.post('/products', upload.single('image'), productController.createProduct);



router.get('/products/recommended', productController.getRecommendedProducts); // place BEFORE /products/:productId

router.get('/products', productController.getAllProducts);
router.get('/products/search', productController.searchProducts);

router.get('/products/category/:categoryId/subcategory/:subcategoryId', productController.getProductsByCategoryAndSubcategory);
router.get('/products/by-category/:categoryId', productController.getProductsByCategoryAllSubcategories); // ✅ NEW
router.get('/products/category/:categoryId', productController.getProductsByCategory);
router.get('/products/featured', productController.getFeaturedProducts);

router.get('/products/:productId', productController.getProductById); // Keep this last for /products/* routes

// In your route file, before calling the controller
router.put('/products/:productId', upload.single('image'), (req, res, next) => {
  console.log('Update Product Request:');
  console.log('Params:', req.params);
  console.log('Files:', req.file);
  console.log('Body:', req.body);
  next();
}, productController.updateProduct);
router.delete('/products/:productId', productController.deleteProduct);
router.get('/products/seller-products/:sellerId', productController.getSellerProducts);


module.exports = router;
