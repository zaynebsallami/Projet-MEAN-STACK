const Product = require('../models/product');
const Category = require('../models/category');
const Subcategory = require('../models/subcategory'); // Make sure you import this if you use it in updateCategoryCounts
const path = require('path');
const fs = require('fs');


async function updateCategoryCounts(categoryId, subcategoryId) {
  try {
    // Update subcategory product count
    const subcategoryCount = await Product.countDocuments({ subcategory: subcategoryId });
    await Subcategory.findByIdAndUpdate(subcategoryId, { productCount: subcategoryCount });

    // Update category product count (sum of all products under the category)
    const categoryCount = await Product.countDocuments({ category: categoryId });
    await Category.findByIdAndUpdate(categoryId, { productCount: categoryCount });
  } catch (error) {
    console.error('Error updating category/subcategory counts:', error);
  }
}

exports.createProduct = async (req, res) => {
  console.log('Données reçues par le backend (req.body):', req.body);
  console.log('Fichier reçu (req.file):', req.file);

const { name, price, category, subcategory, seller } = req.body;

if (!name || !price || !category || !seller) {
  return res.status(400).json({
    success: false,
    message: 'Tous les champs requis doivent être remplis : name, price, category, seller.'
  });
}


  try {
    const newProduct = new Product({
  name,
  price,
  description: req.body.description || '',
  category,
  subcategory: subcategory || null,
  stock: req.body.stock || 0,
  seller,
  image: req.file ? req.file.filename : ''
});
    const savedProduct = await newProduct.save();
    res.status(201).json({
      success: true,
      product: savedProduct
    });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur technique est survenue.'
    });
  }
};

// Get all products under a category's subcategories
exports.getProductsByCategoryAllSubcategories = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Find the category and its subcategories
    const category = await Category.findById(categoryId).populate('subcategories');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const subcategoryIds = category.subcategories.map(sc => sc._id);

    // Fetch all products that belong to those subcategories
    const products = await Product.find({
      subcategory: { $in: subcategoryIds }
    }).populate('category').populate('subcategory');

    res.json(products);
  } catch (error) {
    console.error('Error fetching products for all subcategories of a category:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category')
      .populate('subcategory');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('category')
      .populate('subcategory')
      .populate('seller', 'nom email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching product by ID' });
  }
};

// Get products by seller
exports.getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({
      seller: req.params.sellerId
    }).populate('category', 'name');

    // Transformez les chemins d'images en URLs complètes
    const productsWithFullUrls = products.map(product => {
      if (product.image) {
        return {
          ...product.toObject(),
          image: `http://localhost:3000${product.image}`
        };
      }
      return product.toObject();
    });
    
    res.status(200).json({
      status: 'success',
      results: productsWithFullUrls.length,
      data: { products: productsWithFullUrls }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId })
      .populate('category')
      .populate('subcategory');

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products by category' });
  }
};

// Get products by category and subcategory
exports.getProductsByCategoryAndSubcategory = async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.categoryId,
      subcategory: req.params.subcategoryId
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products by category and subcategory' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    let updateData = {};

    // Handle FormData (when image is uploaded)
    if (req.file) {
      updateData = {
        ...req.body,
        image: `/uploads/${req.file.filename}`
      };
    } else {
      // Handle regular JSON data
      updateData = req.body;
    }

    // Convert string values to appropriate types
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ 
        status: 'fail',
        message: 'Product not found' 
      });
    }

    res.status(200).json({
      status: 'success',
      data: { product: updatedProduct }
    });

  } catch (error) {
    console.error('Update error details:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  const query = req.query.q;
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error searching products', error });
  }
};

// Get 6 random recommended products
exports.getRecommendedProducts = async (req, res) => {
  try {
    let products = await Product.aggregate([{ $sample: { size: 6 } }]);

    products = await Product.populate(products, [
      { path: 'category', select: 'name' },
      { path: 'subcategory', select: 'name' },
      { path: 'seller', select: 'nom email' }
    ]);

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching recommended products:', error);
    res.status(500).json({ message: 'Error fetching recommended products' });
  }
};
// Get all featured products

exports.getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true })
      .populate('category')
      .populate('subcategory')
      // .populate('seller', 'nom email');  // Adjust fields if needed

    res.status(200).json(featuredProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ message: 'Error fetching featured products', error: error.message });
  }
};

