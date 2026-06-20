// middleware/auth.js
const { verifyToken } = require("../config/jwt");
const User = require("../models/User");

/**
 * Middleware to verify JWT token
 * Checks if user is authenticated
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route"
      });
    }

    try {
      // Verify token
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || "Invalid token"
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};

/**
 * Middleware to check if user has specific role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    if (!roles.includes(req.user.userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.userRole}' is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is not blocked
 */
const checkStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact administrator."
      });
    }

    next();
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking user status"
    });
  }
};

module.exports = {
  protect,
  authorize,
  checkStatus
};
