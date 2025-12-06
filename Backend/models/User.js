const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'is invalid']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['client', 'vendeur', 'admin'],
    default: 'client'
  },
  telephone: {
    type: String,
    trim: true
  },
  adresse: {
    type: String,
    trim: true
  },
  dateNaissance: {
    type: Date
  },
  avatar: {
    type: String,
    default: 'https://www.gravatar.com/avatar/default?d=mp'
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  preferences: {
    darkMode: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: true },
    language: { type: String, default: 'en' }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  },
  lastLogin: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.twoFactorSecret;
      return ret;
    }
  }
});




// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0;
  if (this.nom) completion += 20;
  if (this.email) completion += 20;
  if (this.telephone) completion += 20;
  if (this.adresse) completion += 20;
  if (this.dateNaissance) completion += 20;
  return completion;
});

const User = mongoose.model('User', userSchema);

module.exports = User;