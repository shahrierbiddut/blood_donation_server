const express = require("express");
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getSingleRequest,
  updateRequest,
  deleteRequest,
  getMyRequests,
  getStats
} = require("../controllers/donationController");
const { protect, checkStatus } = require("../middleware/auth");

// Public
router.get("/", getAllRequests);

// Protected — specific paths MUST come before wildcard /:id
router.post("/", protect, checkStatus, createRequest);
router.get("/user/my", protect, checkStatus, getMyRequests);
router.get("/user/stats", protect, checkStatus, getStats);

// Wildcard — must be last
router.get("/:id", getSingleRequest);
router.put("/:id", protect, checkStatus, updateRequest);
router.delete("/:id", protect, checkStatus, deleteRequest);

module.exports = router;
