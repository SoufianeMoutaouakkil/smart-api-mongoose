const { throwError } = require("../../smUtils/request");

const getRequiredFields = (entityConfig) => {
    entityFields = getFormatedEntityFields(entityConfig);
    return entityFields
        .filter(
            (field) =>
                field.required &&
                !field.fromUser &&
                !field.default &&
                !field.auto
        )
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
    if (!entityConfig || !entityConfig.fields)
        throw new Error("Entity config is not valid.");
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

const setAutoFields = async (entityConfig, ressources, model) => {
    let isArray = true;
    if (!Array.isArray(ressources)) {
        ressources = [ressources];
        isArray = false;
    }
    entityFields = getFormatedEntityFields(entityConfig);
    for (let field of entityFields) {
        if (field.auto) {
            const autoConfig = getAutoConfig(field.auto);

            let doc = null;
            if (autoConfig.pattern === "increment") {
                doc = await model
                    .find()
                    .sort({ [field.name]: -1 })
                    .limit(1);
            } else if (autoConfig.pattern === "decrement") {
                doc = await model
                    .find()
                    .sort({ [field.name]: 1 })
                    .limit(1);
            }
            let dbValue = null;
            if (doc && doc.length > 0) {
                dbValue = doc[0][field.name] ?? null;
            }
            ressources = ressources.map((ressource, index) => {
                let value = getAutoValue(autoConfig, dbValue, index);
                ressource[field.name] = value;
                return ressource;
            });
        }
    }
    return isArray ? ressources : ressources[0];
};

const getAutoValue = (autoConfig, dbValue, index) => {
    let brutValue = null;
    if (dbValue && typeof dbValue === "string") {
        // remove prefix and suffix
        brutValue = dbValue
            .replace(autoConfig.prefix, "")
            .replace(autoConfig.suffix, "");
    }
    // cast to number
    if (autoConfig.type === "number") {
        brutValue = Number(brutValue);
        // increment or decrement
        if (autoConfig.pattern === "increment") brutValue += index + 1;
        else if (autoConfig.pattern === "decrement") brutValue -= index + 1;
        // cast to string with length
        if (autoConfig.length) {
            brutValue = brutValue.toString().padStart(autoConfig.length, "0");
        } else {
            brutValue = brutValue.toString();
        }
    } else if (
        autoConfig.type === "string" &&
        autoConfig.pattern === "random"
    ) {
        // generate random string
        brutValue = Math.random().toString(36).substring(2, 15);
        // check if length is defined
        if (autoConfig.length) {
            brutValue = brutValue.substring(0, autoConfig.length);
        }
    }
    let autoValue = "";
    if (autoConfig.prefix) autoValue += autoConfig.prefix;
    autoValue += brutValue;
    if (autoConfig.suffix) autoValue += autoConfig.suffix;

    return autoValue;
};

const getAutoConfig = (auto) => {
    if (!auto) return null;
    if (!auto.pattern) auto.pattern = "increment";
    if (!auto.start) auto.start = 1;
    if (!auto.type) auto.type = "number";
    if (!auto.prefix) auto.prefix = "";
    if (!auto.suffix) auto.suffix = "";
    return auto;
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
    setAutoFields,
    getAutoValue,
};
