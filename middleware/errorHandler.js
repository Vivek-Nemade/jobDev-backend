export const asyncHandler = (requestController) => (req, res, next) => {
  Promise.resolve(requestController(req, res, next)).catch(next);
};

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

    res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
};