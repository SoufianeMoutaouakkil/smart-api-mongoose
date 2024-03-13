const fileMiddleware = (req, res, next) => {
    if (req.files && req.files[0]) req.smartApi.file = req.files[0];

    next();
};

module.exports = fileMiddleware;
