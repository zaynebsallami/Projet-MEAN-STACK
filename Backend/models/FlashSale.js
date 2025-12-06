const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }, 
  discount: { type: Number, required: true }, 
  active: { type: Boolean, default: true },
  isHighlighted: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('FlashSale', flashSaleSchema);
