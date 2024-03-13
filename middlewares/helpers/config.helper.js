const { getFiler } = require("../../smUtils/filer");
const { throwError } = require("../../smUtils/request");

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

const getConfigFilePath = (fileName = "smart-api") => {
    return path.resolve(__dirname, `../../config/${fileName}.yaml`);
};

const getConfigFileContent = (fileName) => {
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

const getDefaultConfigValue = (configField) => {
    const defaultConfigValues = {
        enabled: true,
        fieldsPopulate: true,
        userFieldsCheck: true,
        ressourceFieldsCheck: true,
        relatedFieldsCheck: true,
        fieldsFilter: true,
    };
    return defaultConfigValues[configField];
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
