const smartApiApp = require("./smartApiApp");

const getSmartApiApp = (configFilePath) => {
    // check if configFilePath is provided and exists
    if (!configFilePath) {
        throw new Error("configFilePath is required");
    }
    if (typeof configFilePath !== "string")
        throw new Error("configFilePath must be a string");
    if (!fs.existsSync(configFilePath))
        throw new Error(`config file not found at ${configFilePath}`);

    // set the global config file path
    global.smartApiAppConfigFilePath = configFilePath;
    return smartApiApp;
};

module.exports = getSmartApiApp;
