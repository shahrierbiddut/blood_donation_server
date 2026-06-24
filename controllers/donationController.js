const DonationRequest = require("../models/DonationRequest");
const User = require("../models/User");
const { sanitizeInput } = require("../utils/validators");
const { sendError } = require("../utils/errorResponse");

const VOLUNTEER_ALLOWED_TRANSITIONS = {
  pending: ["inprogress", "cancelled"],
  inprogress: ["done", "cancelled"],
  done: [],
  cancelled: []
};

const sanitizeText = (value) => (typeof value === "string" ? sanitizeInput(value) : value);

const populateRequestById = async (id) => {
  return DonationRequest.findById(id)
    .populate("requester", "name avatar bloodGroup district upazila email phone")
    .populate("donor", "name avatar email phone bloodGroup totalDonations lastDonationDate role status");
};

/**
 * GET /api/admin/donations
 * Admin list of all donation requests with filters + pagination
 */
exports.getAllRequestsAdmin = async (req, res) => {
  try {
    const {
      status,
      bloodGroup,
      district,
      search,
      page = 1,
      limit = 100
    } = req.query;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (bloodGroup && bloodGroup !== "All") filter.bloodGroup = bloodGroup;
    if (district && district !== "All") filter.district = { $regex: district, $options: "i" };
    if (search) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [
        { recipientName: regex },
        { district: regex },
        { upazila: regex },
        { hospitalName: regex },
        { requestMessage: regex }
      ];
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const skip = (pageNumber - 1) * limitNumber;

    const [requests, total, stats] = await Promise.all([
      DonationRequest.find(filter)
        .populate("requester", "name avatar email phone bloodGroup district upazila")
        .populate("donor", "name avatar email phone bloodGroup totalDonations lastDonationDate role status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      DonationRequest.countDocuments(filter),
      DonationRequest.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    const statusCounts = stats.reduce(
      (result, item) => ({ ...result, [item._id]: item.count }),
      { pending: 0, inprogress: 0, done: 0, cancelled: 0 }
    );

    res.status(200).json({
      success: true,
      message: "Donation requests fetched successfully",
      data: {
        requests,
        stats: {
          total,
          ...statusCounts
        },
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error("Admin get all requests error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * POST /api/donations
 * Create a new donation request (auth required)
 */
exports.createRequest = async (req, res) => {
  try {
    const { recipientName, district, upazila, hospitalName, bloodGroup, donationDate, donationTime, requestMessage } = req.body;

    if (!recipientName || !district || !upazila || !hospitalName || !bloodGroup || !donationDate || !donationTime) {
      return sendError(res, 400, "Please provide all required fields");
    }

    const request = await DonationRequest.create({
      requester: req.user.userId,
      recipientName: sanitizeInput(recipientName),
      district: sanitizeInput(district),
      upazila: sanitizeInput(upazila),
      hospitalName: sanitizeInput(hospitalName),
      bloodGroup,
      donationDate: new Date(donationDate),
      donationTime: sanitizeInput(donationTime),
      requestMessage: requestMessage ? sanitizeInput(requestMessage) : ""
    });

    res.status(201).json({ success: true, message: "Donation request created", data: request });
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * GET /api/donations
 * Get all donation requests with filters + pagination
 */
exports.getAllRequests = async (req, res) => {
  try {
    const { bloodGroup, district, upazila, page = 1, limit = 10 } = req.query;

    const filter = { status: "pending" };
    if (bloodGroup && bloodGroup !== "All") filter.bloodGroup = bloodGroup;
    if (district && district !== "All") filter.district = { $regex: district, $options: "i" };
    if (upazila && upazila !== "All") filter.upazila = { $regex: upazila, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      DonationRequest.find(filter)
        .populate("requester", "name avatar bloodGroup district upazila")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DonationRequest.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * GET /api/donations/:id
 * Get a single donation request
 */
exports.getSingleRequest = async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id)
      .populate("requester", "name avatar bloodGroup district upazila email")
      .populate("donor", "name avatar email");

    if (!request) return sendError(res, 404, "Donation request not found");

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Get request error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * POST /api/donations/:id/donate
 * Accept a pending donation request as the current donor
 */
exports.acceptRequest = async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, "Donation request not found");

    if (request.requester.toString() === req.user.userId) {
      return sendError(res, 400, "You cannot donate to your own request");
    }

    if (request.status !== "pending") {
      return sendError(res, 400, "This request has already been accepted");
    }

    request.status = "inprogress";
    request.donor = req.user.userId;
    await request.save();

    const populatedRequest = await DonationRequest.findById(request._id)
      .populate("requester", "name avatar bloodGroup district upazila email")
      .populate("donor", "name avatar email");

    res.status(200).json({
      success: true,
      message: "Donation request accepted",
      data: populatedRequest
    });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * PUT /api/donations/:id
 * Update a donation request (requester or admin)
 */
exports.updateRequest = async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, "Donation request not found");

    const isOwner = request.requester.toString() === req.user.userId;
    const isAdmin = req.user.userRole === "admin";

    const isDonorAccept =
      req.body.status === "inprogress" &&
      request.status === "pending" &&
      !request.donor &&
      request.requester.toString() !== req.user.userId;

    if (!isOwner && !isAdmin && !isDonorAccept) {
      return sendError(res, 403, "Not authorized to update this request");
    }

    const allowed = ["recipientName", "district", "upazila", "hospitalName", "bloodGroup", "donationDate", "donationTime", "requestMessage", "status", "donor"];

    if (isDonorAccept) {
      request.status = "inprogress";
      request.donor = req.user.userId;
      await request.save();

      const populatedRequest = await DonationRequest.findById(request._id)
        .populate("requester", "name avatar bloodGroup district upazila email")
        .populate("donor", "name avatar email");

      return res.status(200).json({ success: true, message: "Donation request accepted", data: populatedRequest });
    }

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        request[field] = req.body[field];
      }
    });

    await request.save();

    res.status(200).json({ success: true, message: "Request updated", data: request });
  } catch (error) {
    console.error("Update request error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * PUT /api/admin/donations/:id
 * Admin updates donation request details and status
 */
exports.adminUpdateRequest = async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, "Donation request not found");

    const fields = [
      "recipientName",
      "district",
      "upazila",
      "hospitalName",
      "bloodGroup",
      "donationDate",
      "donationTime",
      "requestMessage",
      "status"
    ];

    fields.forEach((field) => {
      if (req.body[field] === undefined) return;

      if (field === "donationDate") {
        request[field] = new Date(req.body[field]);
        return;
      }

      if (["recipientName", "district", "upazila", "hospitalName", "donationTime", "requestMessage"].includes(field)) {
        request[field] = sanitizeText(req.body[field]);
        return;
      }

      request[field] = req.body[field];
    });

    if (req.body.donor !== undefined) {
      if (req.body.donor === null) {
        request.donor = null;
      } else {
        const donorUser = await User.findById(req.body.donor);
        if (!donorUser) return sendError(res, 404, "Assigned donor user not found");
        if (donorUser.status === "blocked") return sendError(res, 400, "Blocked users cannot be assigned as donor");
        request.donor = donorUser._id;
      }
    }

    if (request.status === "cancelled") {
      const reason = req.body.cancellationReason;
      request.cancellationReason = reason ? sanitizeText(reason) : request.cancellationReason || "";
    } else if (req.body.status !== undefined || req.body.cancellationReason !== undefined) {
      request.cancellationReason = "";
    }

    await request.save();

    const populatedRequest = await populateRequestById(request._id);

    res.status(200).json({
      success: true,
      message: "Request updated successfully",
      data: populatedRequest
    });
  } catch (error) {
    console.error("Admin update request error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * PUT /api/admin/donations/:id/status
 * Admin updates donation request status
 */
exports.adminUpdateRequestStatus = async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, "Donation request not found");

    request.status = req.body.status;

    if (req.body.status === "cancelled") {
      request.cancellationReason = req.body.cancellationReason ? sanitizeText(req.body.cancellationReason) : request.cancellationReason || "";
    } else {
      request.cancellationReason = "";
    }

    await request.save();

    const populatedRequest = await populateRequestById(request._id);

    res.status(200).json({
      success: true,
      message: "Request status updated successfully",
      data: populatedRequest
    });
  } catch (error) {
    console.error("Admin update status error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * PUT /api/donations/:id/volunteer-status
 * Volunteer updates status on open requests
 */
exports.volunteerUpdateRequestStatus = async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, "Donation request not found");

    const currentStatus = request.status;
    const nextStatus = req.body.status;
    const allowedTransitions = VOLUNTEER_ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(nextStatus) && nextStatus !== currentStatus) {
      return sendError(res, 400, `Invalid status transition from '${currentStatus}' to '${nextStatus}'`);
    }

    if (nextStatus === "cancelled") {
      if (!req.body.cancellationReason || !req.body.cancellationReason.trim()) {
        return sendError(res, 400, "Cancellation reason is required when status is cancelled");
      }
      request.cancellationReason = sanitizeText(req.body.cancellationReason);
    } else {
      request.cancellationReason = "";
    }

    request.status = nextStatus;
    await request.save();

    const populatedRequest = await populateRequestById(request._id);

    res.status(200).json({
      success: true,
      message: "Request status updated successfully",
      data: populatedRequest
    });
  } catch (error) {
    console.error("Volunteer update status error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * DELETE /api/donations/:id
 * Delete a donation request (requester or admin)
 */
exports.deleteRequest = async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, "Donation request not found");

    const isOwner = request.requester.toString() === req.user.userId;
    const isAdmin = req.user.userRole === "admin";

    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "Not authorized to delete this request");
    }

    await request.deleteOne();

    res.status(200).json({ success: true, message: "Request deleted" });
  } catch (error) {
    console.error("Delete request error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * GET /api/donations/my
 * Get current user's own requests
 */
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await DonationRequest.find({ requester: req.user.userId })
      .populate("donor", "name avatar email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Get my requests error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * GET /api/donations/user/in-progress
 * Get requests accepted by the current user as donor
 */
exports.getMyInProgressDonations = async (req, res) => {
  try {
    const requests = await DonationRequest.find({
      donor: req.user.userId,
      status: "inprogress"
    })
      .populate("requester", "name avatar email phone bloodGroup district upazila")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Get my in-progress donations error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/**
 * GET /api/donations/stats
 * Dashboard stats for current user
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [total, inprogress, done, cancelled] = await Promise.all([
      DonationRequest.countDocuments({ requester: userId }),
      DonationRequest.countDocuments({ donor: userId, status: "inprogress" }),
      DonationRequest.countDocuments({ requester: userId, status: "done" }),
      DonationRequest.countDocuments({ requester: userId, status: "cancelled" })
    ]);

    const recentRequests = await DonationRequest.find({ requester: userId })
      .populate("donor", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats: { total, inprogress, done, cancelled },
        recentRequests
      }
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
