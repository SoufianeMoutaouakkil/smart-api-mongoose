const asyncHandler = require("express-async-handler");

const { getLogger } = require("../smUtils/logger");
const logger = getLogger("file");

const { filterObjects } = require("./helpers/action.helper");
const { getSmartApiConfig } = require("./helpers/config.helper");

const mustUpdate = (action) => {
    logger(action, "update Middleware - mustUpdate - action");
    if (!action) {
        return false;
    }
    return action.startsWith("update");
};

const updateMiddleware = asyncHandler(async (req, res, next) => {
    const isUpdatingMode = mustUpdate(req.smartApi?.params?.action);
    if (isUpdatingMode) {
        const { data: incomingData } = req.body;
        let { allowedFields } = req.smartApi?.config ?? {};
        // remove _id from allowed fields
        allowedFields = allowedFields.filter(
            (field) => !["_id", "createdAt", "updatedAt"].includes(field)
        );
        const { dbData } = req.smartApi;

        // get allowed fields values from body
        const allowedFieldsGiven = filterObjects(
            incomingData,
            allowedFields,
            true
        );

        // save updated ressource(s) in one call
        const model = req.smartApi?.model;
        let ids;
        if (Array.isArray(dbData)) {
            ids = dbData.map((ressource) => ressource._id);
        } else {
            ids = [dbData._id];
        }
        const updatedData = await model.updateMany(
            { _id: { $in: ids } },
            allowedFieldsGiven
        );
        const refrechedData = await model.find({ _id: { $in: ids } });

        if (updatedData.modifiedCount === 0) {
            throwError("No ressource updated", "NO_RESSOURCE_UPDATED", 500);
        } else if (updatedData.modifiedCount < ids.length) {
            throwError(
                "Some ressources were not updated",
                "SOME_RESSOURCES_NOT_UPDATED",
                500
            );
        }

        req.smartApi.dbData = refrechedData;
    }

    next();
});

module.exports = updateMiddleware;
