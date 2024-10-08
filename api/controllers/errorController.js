const AppError = require("./../utils/appError");

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProduction = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}\n`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  const message = `The email is already in use. Please use a different ${field}.`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  let message = "";
  let ok = false;
  let passwordMismatch = false;

  for (const errorMsg of errors) {
    if (errorMsg.includes("Passwords are not the same")) {
      passwordMismatch = true;
      continue;
    }

    if (
      !errorMsg.includes("password") &&
      !errorMsg.includes("passwordConfirm")
    ) {
      message += errorMsg + " ";
    } else if (ok === false && !passwordMismatch) {
      message += "Password must be longer than 8 characters ";
      ok = true;
    }
  }

  if (passwordMismatch) {
    message += "Passwords do not match. ";
  }

  return new AppError(message.trim(), 400);
};

const handleJWTExpiredError = () => {
  return new AppError("Your token has expired. Please log in again!", 401);
};

const handleJWTError = () => {
  return new AppError("Invalid token. Please log in again!", 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    error.message = err.message;
    error.name = err.name;
    error.stack = err.stack;
    error.isOperational = err.isOperational;

    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    }

    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    if (error.name === "ValidationError") {
      error = handleValidationErrorDB(error);
    }

    if (error.name === "TokenExpiredError") {
      error = handleJWTExpiredError(error);
    }

    if (error.name === "JsonWebTokenError") {
      error = handleJWTError();
    }

    sendErrorProduction(error, res);
  }
};
