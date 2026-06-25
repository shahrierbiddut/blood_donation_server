// server/routes/stripe.js
const express = require("express");
const Funding = require("../models/Funding");
const { protect, checkStatus } = require("../middleware/auth");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (stripeSecretKey) {
  stripe = require("stripe")(stripeSecretKey);
}

const router = express.Router();

router.post("/create-session", protect, checkStatus, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ success: false, message: "Stripe is not configured on the server." });
  }

  try {
    const { amountCents, name, successUrl, cancelUrl } = req.body;

    if (!amountCents || amountCents < 100) {
      return res.status(400).json({ success: false, message: "Minimum amount is $1.00" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "BloodBridge Donation" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: req.user?.email,
      metadata: {
        userId: req.user?.userId,
        donorName: name || "Anonymous",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.status(200).json({ success: true, id: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe create session error:", error);
    res.status(500).json({ success: false, message: "Unable to create Stripe session" });
  }
});

const webhookHandler = async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ success: false, message: "Stripe is not configured on the server." });
  }

  try {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const existing = await Funding.findOne({ stripeSessionId: session.id });
      if (!existing) {
        const fundingData = {
          user: session.metadata?.userId || undefined,
          name: session.metadata?.donorName || session.customer_details?.name || "Anonymous",
          amount: session.amount_total,
          currency: session.currency,
          paymentMethod: session.payment_method_types?.[0] || "card",
          status: session.payment_status === "paid" ? "Completed" : "Pending",
          transactionId: session.payment_intent,
          stripePaymentIntentId: session.payment_intent,
          stripeSessionId: session.id,
        };

        await Funding.create(fundingData);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error.message || error);
    res.status(400).json({ success: false, message: error.message || "Webhook error" });
  }
};

module.exports = { router, webhookHandler };