const { throwError } = require("../../smUtils/request");

const getRequiredFields = (entityConfig) => {
    entityFields = getFormatedEntityFields(entityConfig);
    return entityFields
        .filter((field) => field.required && !field.fromUser && !field.default)
        .map((field) => field.name);
};

const getExistingAllowedFields = (data, allowedFields, errorMode = false) => {
    if (!data) return [];
    if (data)
        if (Array.isArray(data)) {
            return data.map((ressource) =>
                Object.keys(ressource).filter((field) =>
                    allowedFields.includes(field)
                )
            );
        }
    return Object.keys(data).filter((field) => allowedFields.includes(field));
};

const getMissedRequiredFields = (data, requiredFields) => {
    const output = requiredFields.filter(
        (field) => !Object.keys(data).includes(field)
    );
    return output;
};
const getFormatedEntityFields = (entityConfig) => {
    const entityFields = Object.keys(entityConfig.fields);
    let formatedConfig = [];
    entityFields.map((field) => {
        let fieldConfig = entityConfig.fields[field];
        fieldConfig.name = field;
        formatedConfig.push(fieldConfig);
    });

    return formatedConfig;
};
const checkRequiredFields = (entityConfig, data) => {
    const requiredFields = getRequiredFields(entityConfig);
    const missedRequiredFields = getMissedRequiredFields(data, requiredFields);
    return missedRequiredFields.length > 0 ? missedRequiredFields : null;
};

const fitWithUserData = (entityConfig, ressources, user) => {
    let isArray = true;
    if (!Array.isArray(ressources)) {
        ressources = [ressources];
        isArray = false;
    }
    entityFields = getFormatedEntityFields(entityConfig);
    entityFields.forEach((field) => {
        if (field.fromUser) {
            ressources = ressources.map((ressource) => {
                if (
                    field.required &&
                    !user[field.fromUser] &&
                    !ressource[field.name]
                ) {
                    throw new Error(
                        `Field ${field.name} is required and does not have a value and can not get value from user.`
                    );
                } else {
                    ressource[field.name] = user[field.fromUser];
                }
                return ressource;
            });
        }
    });
    return isArray ? ressources : ressources[0];
};

const filterObjects = (objects, fields, isErrorMode = false) => {
    const isArray = Array.isArray(objects);
    if (!isArray) objects = [objects];
    objects = objects.map((object) => {
        // handle mongoose objects
        object = object.toObject ? object.toObject() : object;
        for (const field in object) {
            if (!fields.includes(field) && !isErrorMode) {
                delete object[field];
            } else if (!fields.includes(field)) {
                throwError(
                    `Field '${field}' is not allowed for this action for the current user. Allowed fields are: < ${fields} >.`,
                    400
                );
            }
        }
        return object;
    });
    return isArray ? objects : objects[0];
};

module.exports = {
    getRequiredFields,
    getExistingAllowedFields,
    getMissedRequiredFields,
    checkRequiredFields,
    fitWithUserData,
    filterObjects,
};
