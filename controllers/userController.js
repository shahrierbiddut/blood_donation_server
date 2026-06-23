const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/errorResponse");
const { sanitizeInput } = require("../utils/validators");

const SAFE_USER_SELECT = "-password -verificationToken -verificationTokenExpire -__v";

const buildLocationFilter = (location) => {
  if (!location) {
    return null;
  }

  const regex = new RegExp(location, "i");
  return {
    $or: [
      { division: regex },
      { district: regex },
      { upazila: regex },
      { union: regex },
      { address: regex }
    ]
  };
};

const applyRoleFlags = (user, role) => {
  user.role = role;
  user.isAdmin = role === "admin";
  user.isVolunteer = role === "volunteer";
  user.isDonor = role === "donor";
};

exports.getAllUsersAdmin = async (req, res) => {
  try {
    const { page, limit, role, bloodGroup, status, location } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (status) filter.status = status;

    const locationFilter = buildLocationFilter(location);
    if (locationFilter) {
      Object.assign(filter, locationFilter);
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).select(SAFE_USER_SELECT).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    return sendSuccess(res, 200, "Users fetched successfully", {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        role: role || null,
        bloodGroup: bloodGroup || null,
        status: status || null,
        location: location || null
      }
    });
  } catch (error) {
    console.error("Get all users admin error:", error);
    return sendError(res, 500, "Failed to fetch users");
  }
};

exports.getUserByIdAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(SAFE_USER_SELECT);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "User fetched successfully", user);
  } catch (error) {
    console.error("Get user by id admin error:", error);
    return sendError(res, 500, "Failed to fetch user");
  }
};

exports.updateUserRoleAdmin = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    applyRoleFlags(user, role);
    user.updatedAt = new Date();
    await user.save();

    return sendSuccess(res, 200, "User role updated successfully", {
      _id: user._id,
      role: user.role,
      isAdmin: user.isAdmin,
      isVolunteer: user.isVolunteer,
      isDonor: user.isDonor
    });
  } catch (error) {
    console.error("Update user role error:", error);
    return sendError(res, 500, "Failed to update user role");
  }
};

exports.updateUserStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    user.status = status;
    user.updatedAt = new Date();
    await user.save();

    return sendSuccess(res, 200, "User status updated successfully", {
      _id: user._id,
      status: user.status
    });
  } catch (error) {
    console.error("Update user status error:", error);
    return sendError(res, 500, "Failed to update user status");
  }
};

exports.deleteUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    await user.deleteOne();

    return sendSuccess(res, 200, "User deleted successfully", {
      _id: user._id
    });
  } catch (error) {
    console.error("Delete user admin error:", error);
    return sendError(res, 500, "Failed to delete user");
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { name, bloodGroup, location, page, limit } = req.query;

    const filter = { status: "active" };

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }

    const locationFilter = buildLocationFilter(location);
    if (locationFilter) {
      Object.assign(filter, locationFilter);
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name avatar bloodGroup division district upazila union role status totalDonations")
        .sort({ totalDonations: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    return sendSuccess(res, 200, "Users searched successfully", {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Search users error:", error);
    return sendError(res, 500, "Failed to search users");
  }
};

exports.updateOwnProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const isAdmin = req.user.userRole === "admin";
    const isOwner = req.user.userId === id;

    if (!isAdmin && !isOwner) {
      return sendError(res, 403, "You can only update your own profile");
    }

    const forbiddenFields = ["role", "status", "password", "email", "isAdmin", "isDonor", "isVolunteer"];
    for (const field of forbiddenFields) {
      if (req.body[field] !== undefined) {
        return sendError(res, 400, `${field} cannot be updated from this route`);
      }
    }

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    const editableFields = [
      "name",
      "phone",
      "bloodGroup",
      "division",
      "district",
      "upazila",
      "union",
      "address",
      "avatar",
      "emergencyContact",
      "medicalHistory"
    ];

    editableFields.forEach((field) => {
      if (req.body[field] === undefined) {
        return;
      }

      if (req.body[field] === null || req.body[field] === "") {
        user[field] = null;
        return;
      }

      user[field] = typeof req.body[field] === "string" ? sanitizeInput(req.body[field]) : req.body[field];
    });

    user.updatedAt = new Date();
    await user.save();

    const updatedUser = await User.findById(id).select(SAFE_USER_SELECT);
    return sendSuccess(res, 200, "Profile updated successfully", updatedUser);
  } catch (error) {
    console.error("Update own profile error:", error);
    return sendError(res, 500, "Failed to update profile");
  }
};
