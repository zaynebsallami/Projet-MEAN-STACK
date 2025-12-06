const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const adminSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },  // important: select: false
  avatar: {
    type: String,
    default: 'https://www.gravatar.com/avatar/default?d=mp'
  },
  role: { type: String, default: 'admin' },
  telephone: { type: String },
  dateDerniereConnexion: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Avant sauvegarde, hash le mot de passe si modifié
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model('Admin', adminSchema, 'admin');
