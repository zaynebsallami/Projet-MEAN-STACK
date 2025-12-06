const mongoose = require('mongoose');

const SubcategorySchema = new mongoose.Schema({
  name: String,
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    productCount: { type: Number, default: 0 } // Add this field

});

const Subcategory = mongoose.model('Subcategory', SubcategorySchema);

module.exports = Subcategory;
