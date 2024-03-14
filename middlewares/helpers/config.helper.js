const { getFiler } = require("../../smUtils/filer");
const { throwError } = require("../../smUtils/request");
const path = require("path");

const getYamlFiler = () => {
    try {
        return getFiler("yaml");
    } catch (error) {
        throwError(
            "Yaml filer is not available",
            "YAML_FILER_NOT_AVAILABLE",
            500
        );
    }
};

const getConfigFilePath = (fileName) => {
    if (!global.smartApiAppConfigFilePath) {
        throwError(
            "Smart Api App config file path is not available",
            "SMART_API_APP_CONFIG_FILE_PATH_NOT_AVAILABLE",
            500
        );
    }
    if (typeof fileName !== "string") {
        throwError("File name must be a string", "INVALID_FILE_NAME", 400);
    }
    return path.resolve(smartApiAppConfigFilePath, fileName + ".yaml");
};

const getConfigFileContent = (fileName = "smart-api") => {
    const filer = getYamlFiler();
    const config = filer.read(getConfigFilePath(fileName));
    return config;
};

const getAllowedConfigProps = () => {
    return [
        "enabled",
        "userFilter",
        "queryFilter",
        "fieldsPopulate",
        "ressourceFilter",
        "fieldsFilter",
    ];
};

const getSmartApiConfig = (ressourceName, ...keys) => {
    const config = getConfigFileContent();
    if (!config?.[ressourceName]) return null;
    const resourceConfig = config[ressourceName];
    let result = resourceConfig;
    keys.forEach((key) => {
        result = result[key] ?? {};
    });

    return result;
};

const getAllowedFields = (ressourceFields, fieldsConfig) => {
    ressourceFields = ["_id", ...ressourceFields];
    let allowedFields = ressourceFields;
    if (!fieldsConfig) {
        allowedFields = ressourceFields;
    } else if (fieldsConfig.allowed) {
        allowedFields = ressourceFields.filter((key) =>
            fieldsConfig.allowed.includes(key)
        );
    } else if (fieldsConfig.denied) {
        allowedFields = ressourceFields.filter(
            (key) => !fieldsConfig.denied.includes(key)
        );
    }
    return allowedFields;
};

module.exports = {
    getSmartApiConfig,
    getAllowedConfigProps,
    getAllowedFields,
    getConfigFileContent,
};
