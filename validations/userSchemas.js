const { z } = require("zod");

const roles = ["donor", "volunteer", "admin"];
const statuses = ["active", "blocked"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

const adminUsersQuerySchema = paginationSchema.extend({
  role: z.enum(roles).optional(),
  bloodGroup: z.enum(bloodGroups).optional(),
  status: z.enum(statuses).optional(),
  location: z.string().trim().min(1).max(100).optional()
});

const userIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid user id")
});

const updateRoleSchema = z.object({
  role: z.enum(roles)
});

const updateStatusSchema = z.object({
  status: z.enum(statuses)
});

const userSearchQuerySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  bloodGroup: z.enum(bloodGroups).optional(),
  location: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

const userProfileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().max(20).nullable().optional(),
    bloodGroup: z.enum(bloodGroups).optional(),
    division: z.string().trim().min(1).max(100).optional(),
    district: z.string().trim().min(1).max(100).optional(),
    upazila: z.string().trim().min(1).max(100).optional(),
    union: z.string().trim().min(1).max(100).optional(),
    address: z.string().trim().max(200).nullable().optional(),
    avatar: z.string().trim().max(5_000_000).nullable().optional(),
    emergencyContact: z.string().trim().max(20).nullable().optional(),
    medicalHistory: z.string().trim().max(500).nullable().optional()
  })
  .strict();

module.exports = {
  adminUsersQuerySchema,
  userIdParamSchema,
  updateRoleSchema,
  updateStatusSchema,
  userSearchQuerySchema,
  userProfileUpdateSchema,
  roles,
  statuses,
  bloodGroups
};
