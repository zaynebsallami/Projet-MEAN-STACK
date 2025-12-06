const mongoose = require('mongoose');
const Subcategory = require('./subcategory');  // Import Subcategory model

const categorySchema = new mongoose.Schema({
  name: String,
  image: String,
  subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' }],  // Reference to Subcategory model
    productCount: { type: Number, default: 0 } // Add this field

});

const category = mongoose.model('Category', categorySchema);

module.exports = category;
