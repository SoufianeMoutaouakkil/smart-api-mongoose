const resMiddleware = (req, res, next) => {
    const { params, config, user, dbData, dbQuery } = req.smartApi;
    res.json({
        dbData,
        params,
        config,
        dbQuery,
        user,
    });
};

module.exports = resMiddleware;
