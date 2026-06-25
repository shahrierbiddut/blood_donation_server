// server/models/Funding.js
const mongoose = require('mongoose');
const FundingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  name: { type: String, required: true },
  amount: { type: Number, required: true }, // cents
  currency: { type: String, default: 'usd' },
  stripePaymentIntentId: String,
  stripeSessionId: String,
}, { timestamps: true });
module.exports = mongoose.model('Funding', FundingSchema);