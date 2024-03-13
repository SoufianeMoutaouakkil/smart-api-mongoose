const asyncHandler = require("express-async-handler");
const { throwError } = require("../smUtils/request");
const {
    filterObjects,
    checkRequiredFields,
    fitWithUserData,
} = require("./helpers/action.helper");
const { getSmartApiConfig } = require("./helpers/config.helper");

const mustCreate = (action) => {
    if (!action) {
        return false;
    }
    return action.startsWith("create");
};

const verifyRequiredFields = (config, data) => {
    const missedRequiredFields = checkRequiredFields(config, data);
    if (missedRequiredFields) {
        throwError(
            `Missing required fields: ${missedRequiredFields.join(", ")} for data: ${JSON.stringify(data)}`,
            "MISSING_REQUIRED_FIELDS"
        );
    }
};

const getRessourceData = (data, fields, user, config) => {
    // Check if required fields are present
    verifyRequiredFields(config, data);

    // get allowed fields values from body
    const fieldsGiven = filterObjects(data, fields);

    let ressource = fitWithUserData(config, fieldsGiven, user);
    delete ressource._id;
    return ressource;
};

const createOne = async (model, data, user, config, fields) => {
    const ressourceData = getRessourceData(data, fields, user, config);
    const ressource = await model.create(ressourceData);
    return ressource;
};

const createMany = async (model, datas, user, config, fields) => {
    // Check if required fields are present
    let ressources = [];
    for (let data of datas) {
        const ressourceData = getRessourceData(data, fields, user, config);
        ressources.push(ressourceData);
    }
    // create new ressources with allowed fields values given
    ressources = await model.insertMany(ressources);
    return ressources;
};

const createMiddleware = asyncHandler(async (req, res, next) => {
    if (mustCreate(req.smartApi?.params?.action)) {
        const ressourceName = req.smartApi?.params?.ressourceName;
        const user = req.smartApi?.user;
        const model = req.smartApi?.model;
        const config = getSmartApiConfig(ressourceName, "schema");
        const data = req.smartApi?.bodyData;
        const { allowedFields: fields } = req.smartApi?.config || {};

        // Check if entity config exists in entities.yaml
        if (!config) {
            throwError(
                `Interne error. Entity ${ressourceName} don't have a schema configuration`,
                "ENTITY_CONFIG_NOT_FOUND"
            );
        }
        let dbData;
        if (!data) {
            throwError("Data is required", "DATA_REQUIRED", 400);
        } else if (!Array.isArray(data)) {
            dbData = await createOne(model, data, user, config, fields);
        } else {
            dbData = await createMany(model, data, user, config, fields);
        }
        req.smartApi.dbData = dbData;
    }
    next();
});

module.exports = createMiddleware;
