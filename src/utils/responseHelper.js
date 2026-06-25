const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, statusCode = 500, message = 'Internal Server Error', error = null) => {
  let errorDetail = null;
  if (error) {
    errorDetail = typeof error === 'string' ? error : (error.message || error.toString());
  }
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorDetail
  });
};

module.exports = {
  sendSuccess,
  sendError
};
