const smartApiApp = require("./smartApiApp");
const fs = require("fs");
global.smartApiDirPath = __dirname;

const getSmartApiApp = (configFileDirPath) => {
    // check if configFileDirPath is provided and exists
    if (!configFileDirPath) {
        throw new Error("configFileDirPath is required");
    }
    if (typeof configFileDirPath !== "string")
        throw new Error("configFileDirPath must be a string");
    if (!fs.existsSync(configFileDirPath))
        throw new Error(`config file not found at ${configFileDirPath}`);

    // set the global config file path
    global.smartApiAppConfigFilePath = configFileDirPath;
    return smartApiApp;
};

module.exports = getSmartApiApp;
