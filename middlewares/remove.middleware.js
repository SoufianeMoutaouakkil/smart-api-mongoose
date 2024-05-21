const asyncHandler = require("express-async-handler");
const { throwError } = require("../smUtils/request");

const mustRemove = (action) => {
    if (!action) {
        return false;
    }
    return action.startsWith("remove");
};

const removeMiddleware = asyncHandler(async (req, res, next) => {
    if (mustRemove(req.smartApi?.params?.action)) {
        const { dbData } = req.smartApi;
        if (dbData) {
            // remove the document or documents
            try {
                let ids = [];
                if (Array.isArray(dbData)) {
                    ids = dbData.map((ressource) => ressource._id);
                } else {
                    ids = [dbData._id];
                }
                const model = req.smartApi?.model;
                const removedData = await model.deleteMany({
                    _id: { $in: ids },
                });
                if (removedData.deletedCount === 0 && ids.length !== 0) {
                    throwError(
                        "No ressource removed",
                        "NO_RESSOURCE_REMOVED",
                        500
                    );
                } else if (removedData.deletedCount < ids.length) {
                    throwError(
                        "Some ressources were not removed",
                        "SOME_RESSOURCES_NOT_REMOVED",
                        500
                    );
                }
            } catch (error) {
                throwError(
                    "Internal Server Error while removing the document(s)! error: " +
                        error.message
                );
            }
        }
    }
    next();
});

module.exports = removeMiddleware;
