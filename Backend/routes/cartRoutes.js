const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/auth'); // Your auth middleware here

router.use(authMiddleware); // Protect all cart routes

router.get('/', cartController.getCart);
router.post('/', cartController.addOrUpdateItem);
router.delete('/:itemId', cartController.removeItem);

module.exports = router;
