const { z } = require("zod");

const createContactSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters")
      .trim(),
    email: z
      .string()
      .email("Please provide a valid email address")
      .trim()
      .toLowerCase(),
    subject: z
      .string()
      .min(5, "Subject must be at least 5 characters")
      .max(100, "Subject cannot exceed 100 characters")
      .trim(),
    message: z
      .string()
      .min(10, "Message must be at least 10 characters")
      .max(5000, "Message cannot exceed 5000 characters")
      .trim()
  })
});

const updateContactStatusSchema = z.object({
  body: z.object({
    status: z.enum(["new", "replied", "closed"], {
      errorMap: () => ({
        message: "Status must be either new, replied, or closed"
      })
    }),
    reply: z
      .string()
      .min(5, "Reply must be at least 5 characters")
      .optional()
  })
});

module.exports = {
  createContactSchema,
  updateContactStatusSchema
};
