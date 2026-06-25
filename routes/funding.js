const express = require("express");
const { protect, checkStatus } = require("../middleware/auth");
const { getFundingHistory, getFundingTotal } = require("../controllers/fundingController");

const router = express.Router();

// Private route for authenticated users
router.get("/", protect, checkStatus, getFundingHistory);
router.get("/total", protect, checkStatus, getFundingTotal);

module.exports = router;
