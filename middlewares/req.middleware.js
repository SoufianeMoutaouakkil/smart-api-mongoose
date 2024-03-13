const { getReqParams, throwError } = require("../smUtils/request");

const reqMiddleware = (req, res, next) => {
    if (!req.smartApi) req.smartApi = {};
    try {
        const {
            action,
            ressourceName,
            id,
            ids,
            query,
            isExmode,
            isImmode,
            format,
        } = getReqParams(req.method, req.path, req.query, req.body);

        req.smartApi.params = {
            action,
            ressourceName,
            id,
            ids,
            query,
            isExmode,
            isImmode,
            format,
        };
        req.smartApi.bodyData = req.body.data;
    } catch (error) {
        throwError(error.message, "INVALID_REQUEST", 400);
    }
    const { getLogger } = require("../smUtils/logger");
    const logger = getLogger("file");
    logger(req.smartApi.params, "reqMiddleware: req.smartApi.params:");
    next();
};

module.exports = reqMiddleware;
