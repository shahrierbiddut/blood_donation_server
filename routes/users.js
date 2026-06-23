const express = require("express");
const router = express.Router();

const { protect, checkStatus } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { userSearchQuerySchema, userIdParamSchema, userProfileUpdateSchema } = require("../validations/userSchemas");
const { searchUsers, updateOwnProfile } = require("../controllers/userController");

router.get("/search", validate(userSearchQuerySchema, "query"), searchUsers);
router.put("/:id/profile", protect, checkStatus, validate(userIdParamSchema, "params"), validate(userProfileUpdateSchema), updateOwnProfile);

module.exports = router;
