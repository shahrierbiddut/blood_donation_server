const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact
} = require("../controllers/contactController");
const {
  createContactSchema,
  updateContactStatusSchema
} = require("../validations/contactSchemas");

const router = express.Router();

// Public route - Create contact message
router.post("/", validate(createContactSchema), createContact);

// Admin routes - Protected with auth and admin role
router.get("/admin/all", protect, authorize(["admin"]), getAllContacts);
router.get("/admin/:id", protect, authorize(["admin"]), getContactById);
router.put(
  "/admin/:id/status",
  protect,
  authorize(["admin"]),
  validate(updateContactStatusSchema),
  updateContactStatus
);
router.delete("/admin/:id", protect, authorize(["admin"]), deleteContact);

module.exports = router;
