const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Use express.raw() for the webhook endpoint to verify Stripe signature
router.post("/webhook", paymentController.handleWebhook);
router.post("/checkout", paymentController.createCheckoutSession);

module.exports = router;
