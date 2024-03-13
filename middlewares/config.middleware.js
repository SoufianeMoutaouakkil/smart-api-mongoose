const { throwError } = require("../smUtils/request");
const asyncHandler = require("express-async-handler");

const {
    getSmartApiConfig,
    getAllowedConfigProps,
    getAllowedFields,
} = require("./helpers/config.helper");

const getRessourceConfig = (ressourceName) => {
    const ressourceConfig = getSmartApiConfig(ressourceName, "permissions");
    if (!ressourceConfig) {
        throwError(
            `Permissions config for ${ressourceName} is not available`,
            "CONFIG_NOT_AVAILABLE",
            400
        );
    }
    return ressourceConfig;
};

const getFinalConfig = (ressourceName, action, userRole) => {
    const ressourceConfig = getRessourceConfig(ressourceName);
    const configProps = getAllowedConfigProps();
    const config = {};
    const ressourceDefaultConfig = ressourceConfig["default"] ?? {};
    const actionDefaultConfig = ressourceConfig[action]?.["default"] ?? {};

    // get final config by merging default config from ressource, action and role
    configProps.forEach((prop) => {
        // first set the default value from ressource
        config[prop] = ressourceDefaultConfig[prop] ?? undefined;

        // then override with action default value if available and it's not "no-inherit"
        if (actionDefaultConfig[prop] !== undefined) {
            if (actionDefaultConfig[prop] === "no-inherit")
                config[prop] = undefined;
            else config[prop] = actionDefaultConfig[prop];
        }

        // get role specific value
        const rolePropConfig = ressourceConfig[action]?.[userRole]?.[prop];
        // then override with role value if available and it's not "no-inherit"
        if (rolePropConfig !== undefined) {
            if (rolePropConfig == "no-inherit") config[prop] = undefined;
            else config[prop] = rolePropConfig;
        }
    });

    return config;
};

const configMiddleware = asyncHandler((req, res, next) => {
    if (!req.smartApi) req.smartApi = {};
    if (!req.smartApi.params)
        throwError(
            "req.smartApi.params is not defined",
            "PARAMS_FROM_REQ_MIDDLEWARE_MISSED",
            500
        );

    const { action, ressourceName } = req.smartApi.params;
    const userRole = req.smartApi.user?.role;

    let config = getFinalConfig(ressourceName, action, userRole);

    // get allowed fields
    const model = req.smartApi.model;
    let ressourceFields = Object.keys(model.schema.obj);
    const allowedFields = getAllowedFields(
        ressourceFields,
        config.fieldsFilter
    );
    config.allowedFields = allowedFields;
    const { getLogger } = require("../smUtils/logger");
    const logger = getLogger("file");
    logger(config, "Config middleware: config:");
    req.smartApi.config = config;
    next();
});

module.exports = configMiddleware;
