const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
    stock: { type: Number, default: 0 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true ,alias: 'sellerId'},
    image: { type: String },

    // 🆕 New fields:
    hoverImage: { type: String },                // Optional hover image
    isFeatured: { type: Boolean, default: false },// Featured flag
    isNewProduct: { type: Boolean, default: false },     // For new arrivals
    onSale: { type: Boolean, default: false },    // On sale flag
    originalPrice: { type: Number },              // Optional original price
    rating: { type: Number, default: 0 },         // Product rating
    reviewCount: { type: Number, default: 0 },    // Number of reviews
    discountPercentage: { type: Number },         // For badge display
    showStock: { type: Boolean, default: true },  // Whether to show stock progress
    limitedOffer: { type: Boolean, default: false },
    timeLeft: { type: String },                   // e.g. "2h 30m"
    features: [
      {
        name: String,
        icon: String,
        description: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Product || mongoose.model('Product', productSchema);
