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
