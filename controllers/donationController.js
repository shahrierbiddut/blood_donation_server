const DonationRequest = require("../models/DonationRequest");
const { sanitizeInput } = require("../utils/validators");
const { sendError } = require("../utils/errorResponse");

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

    const filter = { status: { $ne: "cancelled" } };
    if (bloodGroup && bloodGroup !== "All") filter.bloodGroup = bloodGroup;
    if (district && district !== "All") filter.district = { $regex: district, $options: "i" };
    if (upazila && upazila !== "All") filter.upazila = { $regex: upazila, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      DonationRequest.find(filter)
        .populate("requester", "name avatar bloodGroup district upazila")
        .populate("donor", "name avatar email")
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
 * PUT /api/donations/:id
 * Update a donation request (requester or admin)
 */
exports.updateRequest = async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, "Donation request not found");

    const isOwner = request.requester.toString() === req.user.userId;
    const isAdmin = req.user.userRole === "admin";

    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "Not authorized to update this request");
    }

    const allowed = ["recipientName", "district", "upazila", "hospitalName", "bloodGroup", "donationDate", "donationTime", "requestMessage", "status", "donor"];

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
 * GET /api/donations/stats
 * Dashboard stats for current user
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [total, inprogress, done, cancelled] = await Promise.all([
      DonationRequest.countDocuments({ requester: userId }),
      DonationRequest.countDocuments({ requester: userId, status: "inprogress" }),
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
