const express = require('express');
const Subcategory = require('../models/subcategory');  // Import your Subcategory model
const Category = require('../models/category'); 
const Product = require('../models/product');

const router = express.Router();

router.post('/categories/bulk', async (req, res) => {
  try {
    // Subcategory names map
    const subcategoryNames = {
      "Mobile Phones": "Mobile Phones",
      "Laptops": "Laptops",
      "Tablets": "Tablets",
      "Clothing": "Clothing",
      "Accessories": "Accessories",
      "Footwear": "Footwear",
      "Furniture": "Furniture",
      "Kitchenware": "Kitchenware",
      "Home Decor": "Home Decor",
      "Makeup": "Makeup",
      "Skincare": "Skincare",
      "Haircare": "Haircare",
      "Football": "Football",
      "Basketball": "Basketball",
      "Fitness": "Fitness",
      "Paintings": "Paintings",
      "Sculptures": "Sculptures",
      "Photography": "Photography"
    };

    // Ensure that subcategories exist, if not, create them
    const subcategoryIds = await Promise.all(
      Object.values(subcategoryNames).map(async (name) => {
        let subcategory = await Subcategory.findOne({ name });
        if (!subcategory) {
          // Create subcategory if it doesn't exist
          subcategory = new Subcategory({ name });
          await subcategory.save();
        }
        return subcategory._id;
      })
    );

    // Define the categories with subcategory ObjectIds
    const categories = [
      {
        name: "CATEGORY_ELECTRONICS",
        image: "../../assets/elec.jpg",
        subcategories: [subcategoryIds[0], subcategoryIds[1], subcategoryIds[2]]
      },
      {
        name: "CATEGORY_FASHION",
        image: "../../assets/fashion.jpg",
        subcategories: [subcategoryIds[3], subcategoryIds[4], subcategoryIds[5]]
      },
      {
        name: "CATEGORY_HOME_LIVING",
        image: "../../assets/home-living.jfif",
        subcategories: [subcategoryIds[6], subcategoryIds[7], subcategoryIds[8]]
      },
      {
        name: "CATEGORY_BEAUTY",
        image: "../../assets/beauty.webp",
        subcategories: [subcategoryIds[9], subcategoryIds[10], subcategoryIds[11]]
      },
      {
        name: "CATEGORY_SPORTS",
        image: "../../assets/sports.jpg",
        subcategories: [subcategoryIds[12], subcategoryIds[13], subcategoryIds[14]]
      },
      {
        name: "CATEGORY_ART",
        image: "../../assets/art.jfif",
        subcategories: [subcategoryIds[15], subcategoryIds[16], subcategoryIds[17]]
      }
    ];

    // Insert the categories into the database
    const insertedCategories = await Category.insertMany(categories);

    res.status(201).json({
      message: 'Categories added successfully',
      categories: insertedCategories
    });
  } catch (error) {
    console.error('Error adding categories:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('subcategories') // fetch full subcategory objects
      .lean();

    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });

        const enrichedSubcategories = await Promise.all(
          (category.subcategories || []).map(async (sub) => {
            const subProductCount = await Product.countDocuments({ subcategory: sub._id });
            return {
              ...sub,
              productCount: subProductCount
            };
          })
        );

        return {
          ...category,
          productCount,
          subcategories: enrichedSubcategories
        };
      })
    );

    res.status(200).json(categoriesWithCounts);
  } catch (error) {
    console.error('Error loading categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error });
  }
});

// POST request to add a new category
router.post('/categories/add', async (req, res) => {
  try {
    const { name, image, subcategories } = req.body;

    // Find the subcategory ObjectIds
    const subcategoryIds = await Promise.all(
      subcategories.map(async (subcategoryName) => {
        const subcategory = await Subcategory.findOne({ name: subcategoryName });
        return subcategory ? subcategory._id : null;
      })
    );

    const newCategory = new Category({
      name,
      image,
      subcategories: subcategoryIds
    });

    await newCategory.save();

    res.status(201).json({
      message: 'Category added successfully',
      category: newCategory
    });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});
// For /categories/:id/subcategories
router.get('/categories/:id/subcategories', async (req, res) => {
  try {
    const subcategories = await Subcategory.aggregate([
      { $match: { category: mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'subcategory',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $project: {
          products: 0
        }
      }
    ]);
    
    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subcategories', error });
  }
});

module.exports = router;
