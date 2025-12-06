const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['vendeur'], default: 'vendeur' },
  adresse: { type: String, required: true },
  telephone: { type: String, required: true },
  dateNaissance: { type: Date, required: true },

  boutique: {
    businessName: { type: String, required: true },
    productType: { type: String, required: true },
    description: { type: String, required: true },
    documentation: { type: String },
    storePhoto: { type: String },
    rating: { type: Number, default: 0 } 
  },

  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

const Seller = mongoose.model('Seller', sellerSchema);
module.exports = Seller;
