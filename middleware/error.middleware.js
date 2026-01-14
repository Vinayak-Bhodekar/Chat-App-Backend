import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  let customError = err;

  // Convert to ApiError if it's not one already
  if (!(customError instanceof ApiError)) {
    const statusCode = customError.statusCode || customError instanceof mongoose.Error ? 400 : 500;
    const message = customError.message || "Something went wrong";

    customError = new ApiError(statusCode, message, customError?.errors || [], err.stack);
  }

  const response = {
    ...customError,
    message: customError.message,
    ...(process.env.NODE_ENV === "development" ? { stack: customError.stack } : {})
  };

  return res.status(customError.statusCode).json(response);
};

export { errorHandler };
