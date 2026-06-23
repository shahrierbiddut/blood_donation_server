const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const donationStatuses = ["pending", "inprogress", "done", "cancelled"];

const donationIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid donation request id")
});

const adminUpdateDonationSchema = z
  .object({
    recipientName: z.string().trim().min(1).max(100).optional(),
    district: z.string().trim().min(1).max(100).optional(),
    upazila: z.string().trim().min(1).max(100).optional(),
    hospitalName: z.string().trim().min(1).max(150).optional(),
    bloodGroup: z.enum(bloodGroups).optional(),
    donationDate: z.coerce.date().optional(),
    donationTime: z.string().trim().min(1).max(50).optional(),
    requestMessage: z.string().trim().max(500).optional(),
    status: z.enum(donationStatuses).optional(),
    donor: z.union([z.string().regex(objectIdRegex), z.null()]).optional(),
    cancellationReason: z.string().trim().max(300).nullable().optional()
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required"
  });

const adminUpdateDonationStatusSchema = z
  .object({
    status: z.enum(donationStatuses),
    cancellationReason: z.string().trim().max(300).nullable().optional()
  })
  .strict();

const volunteerUpdateDonationStatusSchema = z
  .object({
    status: z.enum(donationStatuses),
    cancellationReason: z.string().trim().max(300).nullable().optional()
  })
  .strict();

module.exports = {
  donationStatuses,
  donationIdParamSchema,
  adminUpdateDonationSchema,
  adminUpdateDonationStatusSchema,
  volunteerUpdateDonationStatusSchema
};
