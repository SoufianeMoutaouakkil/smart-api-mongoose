const { throwError } = require("../smUtils/request");

const {
    validateQueryItems,
    evaluateQueryItem,
} = require("./helpers/query.helper");

const checkUserFilter = (config, user) => {
    if (!config) return false;
    if (!config.enabled) return false;
    const userFilter = config.userFilter;
    if (userFilter) {
        const validatedUserFilter = validateQueryItems(userFilter);
        let isAuthorized = true;

        validatedUserFilter.forEach((item) => {
            const isOk = evaluateQueryItem(user, item);
            if (!isOk) isAuthorized = false;
        });

        return isAuthorized;
    } else {
        return true;
    }
};

const userCheckMiddleware = (req, res, next) => {
    if (!req.smartApi) req.smartApi = {};
    const isAuthorized = checkUserFilter(
        req.smartApi.config,
        req.smartApi.user
    );
    if (!isAuthorized)
        throwError(
            `Not authorized : you can't access ${req.smartApi?.params?.ressourceName} with action ${req.smartApi?.params?.action}`,
            "SMART_API_NOT_ENABLED",
            401
        );
    else next();
};

module.exports = userCheckMiddleware;
