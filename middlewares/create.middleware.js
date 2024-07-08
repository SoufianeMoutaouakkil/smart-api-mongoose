const asyncHandler = require("express-async-handler");
const { throwError } = require("../smUtils/request");
const {
    filterObjects,
    checkRequiredFields,
    fitWithUserData,
    setAutoFields,
} = require("./helpers/action.helper");
const { getSmartApiConfig } = require("./helpers/config.helper");

const mustCreate = (action) => {
    if (!action) {
        return false;
    }
    return action.startsWith("create");
};

const getFormatedDataToLog = (data) => {
    if (Object.keys(data).length === 0) {
        return "{}";
    }
    Object.keys(data).map((key) => {
        data[key] =
            typeof data[key] === "string"
                ? data[key].substring(0, 50) + "..."
                : data[key];
    });
    return JSON.stringify(data);
};

const verifyRequiredFields = (config, data) => {
    const missedRequiredFields = checkRequiredFields(config, data);
    if (missedRequiredFields) {
        data = getFormatedDataToLog(data);
        throwError(
            `Missing required fields: ${missedRequiredFields.join(", ")} for data: ${data}`,
            "MISSING_REQUIRED_FIELDS"
        );
    }
};

const getRessourceData = (data, fields, config) => {
    // Check if required fields are present
    verifyRequiredFields(config, data);

    // get allowed fields values from body
    let ressource = filterObjects(data, fields);

    delete ressource._id;
    return ressource;
};

const createOne = async (model, data, user, config, fields) => {
    let ressource = getRessourceData(data, fields, config);

    // setAutoFields and fitWithUserData
    ressource = fitWithUserData(config, ressource, user);
    ressource = await setAutoFields(config, ressource, model);
    ressource = await model.create(ressource);
    return ressource;
};

const createMany = async (model, datas, user, config, fields) => {
    // Check if required fields are present
    let ressources = [];
    for (let data of datas) {
        const ressourceData = getRessourceData(data, fields, config);
        ressources.push(ressourceData);
    }
    // setAutoFields and fitWithUserData
    ressources = fitWithUserData(config, ressources, user);
    ressources = await setAutoFields(config, ressources, model);
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
