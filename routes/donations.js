const express = require("express");
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getSingleRequest,
  acceptRequest,
  updateRequest,
  deleteRequest,
  getMyRequests,
  getMyInProgressDonations,
  getStats,
  volunteerUpdateRequestStatus
} = require("../controllers/donationController");
const { getAllRequestsAdmin } = require("../controllers/donationController");
const { protect, checkStatus, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { donationIdParamSchema, volunteerUpdateDonationStatusSchema } = require("../validations/donationSchemas");

// Public
router.get("/", getAllRequests);

// Protected — specific paths MUST come before wildcard /:id
router.post("/", protect, checkStatus, createRequest);
router.get("/admin/all", protect, checkStatus, authorize("admin"), getAllRequestsAdmin);
router.get("/user/my", protect, checkStatus, getMyRequests);
router.get("/user/in-progress", protect, checkStatus, getMyInProgressDonations);
router.get("/user/stats", protect, checkStatus, getStats);
router.post("/:id/donate", protect, checkStatus, acceptRequest);
router.put("/:id/donate", protect, checkStatus, acceptRequest);
router.put(
  "/:id/volunteer-status",
  protect,
  checkStatus,
  authorize("volunteer"),
  validate(donationIdParamSchema, "params"),
  validate(volunteerUpdateDonationStatusSchema),
  volunteerUpdateRequestStatus
);

// Wildcard — must be last
router.get("/:id", getSingleRequest);
router.put("/:id", protect, checkStatus, updateRequest);
router.delete("/:id", protect, checkStatus, deleteRequest);

module.exports = router;
