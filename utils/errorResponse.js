class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, statusCode = 500, message = "Internal Server Error", data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data
  });
};

module.exports = {
  ErrorResponse,
  sendSuccess,
  sendError
};
