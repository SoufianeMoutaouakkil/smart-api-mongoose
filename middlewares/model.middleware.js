const asyncHandler = require("express-async-handler");
const { getModel, requireAvailableModels } = require("./helpers/model.helper");
const { throwError } = require("../smUtils/request");

const modelMiddleware = asyncHandler(async (req, res, next) => {
    if (!req.smartApi) req.smartApi = {};
    if (!req.smartApi.params)
        throwError(
            "req.smartApi.params is not defined",
            "PARAMS_FROM_REQ_MIDDLEWARE_MISSED",
            500
        );

    const { ressourceName } = req.smartApi.params;
    const model = await getModel(ressourceName);
    if (!model.modelName) {
        throwError(
            "Model is not valid mongoose model",
            "MODEL_IS_NOT_VALID_MONGOOSE_MODEL",
            500
        );
    }
    await requireAvailableModels();
    req.smartApi.model = model;
    next();
});

module.exports = modelMiddleware;
