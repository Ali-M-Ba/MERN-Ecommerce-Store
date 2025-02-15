const handleErrors = (error) => {
  let errRes = {
    status: 500, // Default to internal server error
    message: "An unexpected error occurred.",
  };

  if (error) {
    errRes.status = error.status;
    errRes.message = error.message;

    // MongoDB Duplicate Key Errors
    if (error.code === 11000) {
      errRes.status = 400;
      errRes.message = "Duplicate field value entered";
    }

    // Mongoose Validation Errors (e.g., missing required fields)
    if (error.name === "ValidationError") {
      errRes.status = 400;
      errRes.message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", "); // Collect all validation messages
    }
  }

  return errRes;
};

export const handleError = (res, error) => {
  const errorResponse = handleErrors(error);
  res.status(errorResponse.status).json({
    success: false,
    message: errorResponse.message,
  });
};
