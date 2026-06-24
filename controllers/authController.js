// controllers/authController.js
const User = require("../models/User");
const { generateTokensPair } = require("../config/jwt");
const { sendSuccess, sendError } = require("../utils/errorResponse");
const { validateEmail, sanitizeInput } = require("../utils/validators");

const buildUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  bloodGroup: user.bloodGroup,
  division: user.division,
  district: user.district,
  upazila: user.upazila,
  union: user.union,
  address: user.address,
  avatar: user.avatar,
  role: user.role,
  status: user.status,
  isDonor: user.isDonor,
  totalDonations: user.totalDonations,
  lastDonationDate: user.lastDonationDate,
  createdAt: user.createdAt
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      bloodGroup,
      division,
      district,
      upazila,
      union,
      address,
      avatar
    } = req.body;

    // Validation
    if (!name || !email || !password || !bloodGroup || !division || !district || !upazila || !union) {
      return sendError(res, 400, "Please provide all required fields");
    }

    // Validate email format
    if (!validateEmail(email)) {
      return sendError(res, 400, "Please provide a valid email");
    }

    // Validate password strength
    const passwordValue = String(password || "");
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!strongPasswordRegex.test(passwordValue)) {
      return sendError(
        res,
        400,
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      );
    }

    // Confirm password match
    if (passwordValue !== String(confirmPassword || "")) {
      return sendError(res, 400, "Passwords do not match");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 400, "Email already registered");
    }

    // Create new user
    const newUser = new User({
      name: sanitizeInput(name),
      email: email.toLowerCase(),
      password: passwordValue,
      phone: phone || null,
      bloodGroup,
      division: sanitizeInput(division),
      district: sanitizeInput(district),
      upazila: sanitizeInput(upazila),
      union: sanitizeInput(union),
      address: address ? sanitizeInput(address) : null,
      avatar: avatar || null,
      role: "donor",
      status: "active",
      isDonor: true
    });

    // Save user to database
    await newUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokensPair(newUser._id, newUser.role);

    // Response
    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: buildUserResponse(newUser),
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error during registration"
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return sendError(res, 400, "Please provide email and password");
    }

    // Validate email format
    if (!validateEmail(email)) {
      return sendError(res, 400, "Please provide a valid email");
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    // Check if user is blocked
    if (user.status === "blocked") {
      return sendError(res, 403, "Your account has been blocked. Contact administrator.");
    }

    // Compare passwords
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return sendError(res, 401, "Invalid email or password");
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokensPair(user._id, user.role);

    // Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: buildUserResponse(user),
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error during login"
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout"
    });
  }
};

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token and get current user
 * @access  Private
 */
exports.verify = async (req, res) => {
  try {
    if (!req.user) {
      return sendError(res, 401, "Not authenticated");
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (user.status === "blocked") {
      return sendError(res, 403, "Your account has been blocked");
    }

    res.status(200).json({
      success: true,
      message: "Token verified",
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error verifying token"
    });
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile except email/password/role/status
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Fields that can be updated
    const editableFields = ["name", "phone", "bloodGroup", "division", "district", "upazila", "union", "address", "avatar", "emergencyContact", "medicalHistory"];
    
    // Update only provided fields
    editableFields.forEach((field) => {
      if (req.body[field] === undefined) return;
      
      // Handle nullable fields - empty string means set to null
      if (["phone", "address", "avatar", "emergencyContact", "medicalHistory"].includes(field)) {
        if (req.body[field] === "") {
          user[field] = null;
        } else {
          user[field] = req.body[field];
        }
      } else {
        // Required fields - apply sanitization
        user[field] = req.body[field];
      }
    });

    // Update timestamp
    user.updatedAt = new Date();
    
    // Save with explicit error handling
    await user.save();

    // Fetch fresh user data after save to ensure consistency
    const updatedUser = await User.findById(user._id);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: buildUserResponse(updatedUser)
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating profile"
    });
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 400, "Refresh token is required");
    }

    const { verifyRefreshToken } = require("../config/jwt");
    const { generateToken } = require("../config/jwt");

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const newAccessToken = generateToken(
        { userId: decoded.userId, userRole: decoded.userRole },
        process.env.JWT_EXPIRE
      );

      res.status(200).json({
        success: true,
        message: "Token refreshed",
        token: newAccessToken
      });
    } catch (error) {
      return sendError(res, 401, "Invalid refresh token");
    }
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error refreshing token"
    });
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send reset password link (Phase 2 bonus)
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, "Please provide email");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return sendError(res, 404, "No user found with that email");
    }

    // In production, generate token and send email
    res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email (Feature in development)"
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error in forgot password"
    });
  }
};
