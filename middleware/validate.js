const { ZodError } = require("zod");

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      if (
        source === "body" &&
        req[source] &&
        typeof req[source] === "object" &&
        !Array.isArray(req[source]) &&
        req[source].body &&
        typeof req[source].body === "object" &&
        Object.keys(req[source]).length === 1
      ) {
        req[source] = req[source].body;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((item) => ({
          field: item.path.join(".") || source,
          message: item.message
        }));

        return res.status(400).json({
          success: false,
          message: errors[0] ? `${errors[0].field}: ${errors[0].message}` : "Validation failed",
          data: {
            errors
          }
        });
      }

      return res.status(500).json({
        success: false,
        message: "Validation middleware error",
        data: null
      });
    }
  };
};

module.exports = {
  validate
};
