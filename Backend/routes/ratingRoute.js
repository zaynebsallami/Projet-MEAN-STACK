const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/auth');
const Seller = require('../models/Seller');
const mongoose = require('mongoose');
const Rating = require('../models/rating');

// Modifiez la route pour utiliser :id au lieu de :sellerId
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const sellerId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: 'La note doit être entre 1 et 5 étoiles'
      });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ 
        success: false,
        message: 'Vendeur non trouvé'
      });
    }

    const newRating = new Rating({
      seller: sellerId,
      user: userId,
      rating,
      comment
    });

    await newRating.save();

    const result = await Rating.aggregate([
  { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
  { $group: { _id: null, average: { $avg: "$rating" } } }
]);

    const avgRating = result[0]?.average || 0;

    await Seller.findByIdAndUpdate(sellerId, { 
      rating: parseFloat(avgRating.toFixed(1)) 
    });

    res.status(201).json({
      success: true,
      averageRating: parseFloat(avgRating.toFixed(1))
    });

  }catch (error) {
  console.error('Erreur complète dans POST /:id/rate:', error.stack || error);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: error.message || 'Unknown error'
  });
}
});
// GET /api/sellers/:id/ratings
router.get('/:id/ratings', async (req, res) => {
  try {
    const sellerId = req.params.id;

    const ratings = await Rating.find({ seller: sellerId })
      .populate('user', 'nom') // Pour avoir le nom de l'utilisateur
      .sort({ createdAt: -1 }); // tri du plus récent au plus ancien

    res.status(200).json({ success: true, ratings });
  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
});

module.exports = router;