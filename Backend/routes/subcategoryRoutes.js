const express = require('express');
const Subcategory = require('../models/subcategory'); // Path to your Subcategory model
const router = express.Router();

router.post('/subcategory/add', async (req, res) => {
    try {
      const { name, description, categoryId } = req.body; // Expect categoryId in the request body
  
      // Check if categoryId is provided
      if (!categoryId) {
        return res.status(400).json({ message: 'Category ID is required' });
      }
  
      // Create a new subcategory
      const newSubcategory = new Subcategory({
        name,
        description,
        category: categoryId,  // Assign category to subcategory
      });
  
      // Save the subcategory to the database
      await newSubcategory.save();
  
      // Now, add the subcategory reference to the category's subcategories array
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      category.subcategories.push(newSubcategory._id); // Add subcategory to category's subcategories array
      await category.save(); // Save updated category
  
      res.status(201).json({
        message: 'Subcategory added successfully',
        subcategory: newSubcategory,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error adding subcategory', error });
    }
  });
  
  

// GET route to fetch all subcategories
router.get('/subcategory/get', async (req, res) => {
    try {
      const subcategories = await Subcategory.find();
      res.status(200).json(subcategories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching subcategories', error });
    }
  });
  

  router.put('/subcategory/:id', async (req, res) => {
    try {
      const { name, description } = req.body;
      const subcategory = await Subcategory.findByIdAndUpdate(
        req.params.id,
        { name, description },
        { new: true }
      );
  
      if (!subcategory) {
        return res.status(404).json({ message: 'Subcategory not found' });
      }
  
      res.status(200).json({
        message: 'Subcategory updated successfully',
        subcategory,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating subcategory', error });
    }
  });
  

  router.delete('/subcategory/:id', async (req, res) => {
    try {
      const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ message: 'Subcategory not found' });
      }
      res.status(200).json({
        message: 'Subcategory deleted successfully',
        subcategory,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting subcategory', error });
    }
  });
  

module.exports = router;
