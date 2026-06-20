const validator = require("validator");

const validateEmail = (email) => validator.isEmail(String(email || ""));

const validatePassword = (password) => {
  const value = String(password || "");
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(value);
};

const sanitizeInput = (input) => validator.trim(String(input || ""));

module.exports = {
  validateEmail,
  validatePassword,
  sanitizeInput
};
