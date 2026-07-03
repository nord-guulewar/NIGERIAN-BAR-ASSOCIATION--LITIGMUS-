const timeout = (ms) => {
  return (req, res, next) => {
    req.setTimeout(ms, () => {
      res.status(408).json({
        success: false,
        message: `Request timeout (${ms}ms exceeded). Please try again.`
      });
    });
    res.setTimeout(ms, () => {
      // Response send is already in flight.
    });
    next();
  };
};

module.exports = timeout;
