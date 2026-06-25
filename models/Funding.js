// server/models/Funding.js
const mongoose = require("mongoose");

const FundingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true }, // cents
    currency: { type: String, default: "usd" },
    campaign: { type: String, default: "Emergency Blood Support", trim: true },
    message: { type: String, default: "", trim: true, maxlength: 500 },
    anonymous: { type: Boolean, default: false },
    paymentMethod: { type: String, default: "card" },
    status: { type: String, default: "Completed" },
    transactionId: String,
    stripePaymentIntentId: String,
    stripeSessionId: String
  },
  { timestamps: true }
);

FundingSchema.index({ campaign: 1 });
FundingSchema.index({ status: 1 });
FundingSchema.index({ createdAt: -1 });
FundingSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Funding", FundingSchema);
