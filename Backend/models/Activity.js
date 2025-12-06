const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['login', 'order', 'wishlist', 'profile_update', 'password_change'],
    required: true 
  },
  description: { type: String, required: true },
  metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);