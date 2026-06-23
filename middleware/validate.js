const { ZodError } = require("zod");

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          data: {
            errors: error.errors.map((item) => ({
              field: item.path.join("."),
              message: item.message
            }))
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
