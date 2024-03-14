const resMiddleware = (req, res, next) => {
    const { token, dbData: data } = req.smartApi;
    res.json({
        token,
        data,
    });
};

module.exports = resMiddleware;
