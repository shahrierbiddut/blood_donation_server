// routes/auth.js
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  verify,
  refresh,
  forgotPassword
} = require("../controllers/authController");
const { protect, checkStatus } = require("../middleware/auth");

/**
 * Public Routes
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get tokens
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset link
 * @access  Public
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post("/refresh", refresh);

/**
 * Private Routes
 */

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and get current user
 * @access  Private
 */
router.get("/verify", protect, checkStatus, verify);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", protect, logout);

module.exports = router;
