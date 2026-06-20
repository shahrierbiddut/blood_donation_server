// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false // Don't return password by default
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone cannot be more than 20 characters"]
    },

    // Blood Donation Information
    bloodGroup: {
      type: String,
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        message: "Please select a valid blood group"
      },
      required: [true, "Please provide blood group"]
    },

    // Location Information
    district: {
      type: String,
      required: [true, "Please provide district"],
      trim: true
    },
    upazila: {
      type: String,
      required: [true, "Please provide upazila"],
      trim: true
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot be more than 200 characters"]
    },

    // Profile Information
    avatar: {
      type: String,
      default: null // URL to user's profile picture
    },
    emergencyContact: {
      type: String,
      trim: true,
      maxlength: [20, "Emergency contact cannot be more than 20 characters"]
    },
    medicalHistory: {
      type: String,
      trim: true,
      maxlength: [500, "Medical history cannot be more than 500 characters"]
    },

    // Role & Status
    role: {
      type: String,
      enum: {
        values: ["donor", "volunteer", "admin"],
        message: "Role must be donor, volunteer, or admin"
      },
      default: "donor"
    },
    status: {
      type: String,
      enum: {
        values: ["active", "blocked"],
        message: "Status must be active or blocked"
      },
      default: "active"
    },

    // Role Flags
    isDonor: {
      type: Boolean,
      default: true
    },
    isVolunteer: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },

    // Donation Tracking
    totalDonations: {
      type: Number,
      default: 0
    },
    lastDonationDate: {
      type: Date,
      default: null
    },

    // Account Status
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationTokenExpire: Date,

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "users"
  }
);

// ==================== Indexes ====================
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ bloodGroup: 1 });
UserSchema.index({ district: 1 });
UserSchema.index({ createdAt: -1 });

// ==================== Middleware: Hash Password ====================
UserSchema.pre("save", async function (next) {
  // Only hash password if it's new or modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ==================== Methods ====================

/**
 * Compare password with hashed password
 */
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Get user data without sensitive information
 */
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.verificationTokenExpire;
  return user;
};

/**
 * Get public user profile (limited data)
 */
UserSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    avatar: this.avatar,
    bloodGroup: this.bloodGroup,
    district: this.district,
    upazila: this.upazila,
    role: this.role,
    totalDonations: this.totalDonations
  };
};

module.exports = mongoose.model("User", UserSchema);
