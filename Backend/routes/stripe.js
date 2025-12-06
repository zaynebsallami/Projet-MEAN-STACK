const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('⚠️ Stripe secret key is missing from .env');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, shippingInfo, currency = 'eur' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided for checkout' });
    }

    // Optional: Validate items here (check price, quantity, etc.)
    items.forEach(item => {
      if (typeof item.price !== 'number' || isNaN(item.price)) {
        throw new Error(`Invalid price for item ${item.productId || item.name}`);
      }
      if (!item.quantity || typeof item.quantity !== 'number') {
        item.quantity = 1;
      }
    });

    const line_items = items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name || `Product ${item.productId || 'Unknown'}`,
        },
        unit_amount: Math.round(item.price * 100), // in cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: 'http://localhost:4200/order-confirmation?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:4200/checkout',
      shipping_address_collection: {
        allowed_countries: ['TN'],
      },
      metadata: {
        shippingInfo: JSON.stringify(shippingInfo || {}),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe session creation error:', error.message || error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }

});
// routes/stripe.js (add this)

router.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching Stripe session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});
module.exports = router;
