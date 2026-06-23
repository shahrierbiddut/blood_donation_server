const express = require("express");
const router = express.Router();

const { protect, authorize, checkStatus } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  adminUsersQuerySchema,
  userIdParamSchema,
  updateRoleSchema,
  updateStatusSchema
} = require("../validations/userSchemas");
const {
  getAllUsersAdmin,
  getUserByIdAdmin,
  updateUserRoleAdmin,
  updateUserStatusAdmin,
  deleteUserAdmin
} = require("../controllers/userController");
const { getAllRequestsAdmin, adminUpdateRequest, adminUpdateRequestStatus } = require("../controllers/donationController");
const {
  donationIdParamSchema,
  adminUpdateDonationSchema,
  adminUpdateDonationStatusSchema
} = require("../validations/donationSchemas");

router.use(protect, checkStatus, authorize("admin"));

router.get("/users", validate(adminUsersQuerySchema, "query"), getAllUsersAdmin);
router.get("/users/:id", validate(userIdParamSchema, "params"), getUserByIdAdmin);
router.put("/users/:id/role", validate(userIdParamSchema, "params"), validate(updateRoleSchema), updateUserRoleAdmin);
router.put("/users/:id/status", validate(userIdParamSchema, "params"), validate(updateStatusSchema), updateUserStatusAdmin);
router.delete("/users/:id", validate(userIdParamSchema, "params"), deleteUserAdmin);

router.get("/donations", getAllRequestsAdmin);
router.put("/donations/:id", validate(donationIdParamSchema, "params"), validate(adminUpdateDonationSchema), adminUpdateRequest);
router.put(
  "/donations/:id/status",
  validate(donationIdParamSchema, "params"),
  validate(adminUpdateDonationStatusSchema),
  adminUpdateRequestStatus
);

module.exports = router;
