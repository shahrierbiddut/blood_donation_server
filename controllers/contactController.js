const ContactMessage = require("../models/ContactMessage");
const { sendSuccess, sendError } = require("../utils/errorResponse");
const { sanitizeInput } = require("../utils/validators");

/**
 * Create a new contact message
 * POST /contacts
 */
const createContact = async (req, res) => {
  try {
    const { name, email, phone, address, subject, message } = req.body;

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email).toLowerCase(),
      phone: phone ? sanitizeInput(phone) : null,
      address: address ? sanitizeInput(address) : null,
      subject: sanitizeInput(subject),
      message: sanitizeInput(message)
    };

    // Create contact message
    const contactMessage = new ContactMessage(sanitizedData);
    await contactMessage.save();

    return sendSuccess(
      res,
      201,
      "Thank you for contacting us! We will get back to you soon.",
      {
        id: contactMessage._id,
        email: contactMessage.email,
        phone: contactMessage.phone,
        subject: contactMessage.subject
      }
    );
  } catch (error) {
    console.error("Contact creation error:", error);
    return sendError(res, 500, error.message || "Failed to submit contact message");
  }
};

/**
 * Get all contact messages (Admin only)
 * GET /admin/contacts?page=1&limit=10&status=new&search=email
 */
const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "all", search = "" } = req.query;

    // Build filter
    const filter = {};
    if (status !== "all") {
      filter.status = status;
    }

    // Search by email or name
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } }
      ];
    }

    // Count total documents
    const total = await ContactMessage.countDocuments(filter);

    // Fetch paginated results
    const contacts = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-message -reply") // Don't send full message in list view for performance
      .lean();

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Contact messages retrieved successfully", {
      contacts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    });
  } catch (error) {
    console.error("Get contacts error:", error);
    return sendError(res, 500, error.message || "Failed to retrieve contact messages");
  }
};

/**
 * Get single contact message (Admin only)
 * GET /admin/contacts/:id
 */
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await ContactMessage.findById(id).populate(
      "repliedBy",
      "name email"
    );

    if (!contact) {
      return sendError(res, 404, "Contact message not found");
    }

    return sendSuccess(res, 200, "Contact message retrieved successfully", contact);
  } catch (error) {
    console.error("Get contact error:", error);
    return sendError(res, 500, error.message || "Failed to retrieve contact message");
  }
};

/**
 * Update contact message status and add reply (Admin only)
 * PUT /admin/contacts/:id/status
 */
const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;
    const userId = req.user._id; // From auth middleware

    // Find contact message
    const contact = await ContactMessage.findById(id);

    if (!contact) {
      return sendError(res, 404, "Contact message not found");
    }

    // Update status
    contact.status = status;

    // If status is replied and reply is provided
    if (status === "replied" && reply) {
      contact.reply = sanitizeInput(reply);
      contact.repliedAt = new Date();
      contact.repliedBy = userId;
    }

    await contact.save();

    return sendSuccess(res, 200, "Contact message updated successfully", {
        id: contact._id,
        status: contact.status,
        repliedAt: contact.repliedAt
    });
  } catch (error) {
    console.error("Update contact error:", error);
    return sendError(res, 500, error.message || "Failed to update contact message");
  }
};

/**
 * Delete contact message (Admin only)
 * DELETE /admin/contacts/:id
 */
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await ContactMessage.findByIdAndDelete(id);

    if (!contact) {
      return sendError(res, 404, "Contact message not found");
    }

    return sendSuccess(res, 200, "Contact message deleted successfully", {
      id: contact._id
    });
  } catch (error) {
    console.error("Delete contact error:", error);
    return sendError(res, 500, error.message || "Failed to delete contact message");
  }
};

module.exports = {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact
};
