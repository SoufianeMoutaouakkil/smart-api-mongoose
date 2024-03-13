const { filterObjects } = require("./helpers/action.helper");
const { getLogger } = require("../smUtils/logger");
const logger = getLogger("file");

const supportsFieldsFilter = (action) => {
    if (!action) return false;
    const dataRnedererActions = ["get", "update", "remove", "create"];
    return dataRnedererActions.some((renderAction) =>
        action.startsWith(renderAction)
    );
};
const fieldsFilterMiddleware = (req, res, next) => {
    if (supportsFieldsFilter(req.smartApi?.params?.action)) {
        const data = req.smartApi?.dbData;
        if (!data) return next();

        const { allowedFields: fields } = req.smartApi?.config || {};

        req.smartApi.dbData = filterObjects(data, fields);
        logger(
            {
                data,
                fields,
                output: req.smartApi.dbData,
            },
            "fieldsFilterMiddleware.filterObjects"
        );
    }
    next();
};

module.exports = fieldsFilterMiddleware;
