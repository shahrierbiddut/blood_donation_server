const mongoose = require("mongoose");

const DonationRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester is required"]
    },
    recipientName: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
      maxlength: [100, "Recipient name cannot exceed 100 characters"]
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true
    },
    upazila: {
      type: String,
      required: [true, "Upazila is required"],
      trim: true
    },
    hospitalName: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
      maxlength: [150, "Hospital name cannot exceed 150 characters"]
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        message: "Invalid blood group"
      }
    },
    donationDate: {
      type: Date,
      required: [true, "Donation date is required"]
    },
    donationTime: {
      type: String,
      required: [true, "Donation time is required"],
      trim: true
    },
    requestMessage: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
      default: ""
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "inprogress", "done", "cancelled"],
        message: "Invalid status"
      },
      default: "pending"
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [300, "Cancellation reason cannot exceed 300 characters"],
      default: ""
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true,
    collection: "donation_requests"
  }
);

DonationRequestSchema.index({ requester: 1 });
DonationRequestSchema.index({ bloodGroup: 1 });
DonationRequestSchema.index({ district: 1 });
DonationRequestSchema.index({ status: 1 });
DonationRequestSchema.index({ donationDate: -1 });
DonationRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("DonationRequest", DonationRequestSchema);
