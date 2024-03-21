const fs = require("fs");
global.smartApiDirPath = __dirname;

// import dotenv
require("dotenv").config();

const getSmartApiApp = ({ configPath, apiName }) => {
    // check if configPath is provided and exists
    if (!apiName) apiName = "/my-api";

    if (!configPath) {
        throw new Error("configPath is required");
    }
    if (typeof configPath !== "string" || typeof apiName !== "string")
        throw new Error("configPath and apiName must be a string");
    if (!fs.existsSync(configPath))
        throw new Error(`config file not found at ${configPath}`);

    // set the global config file path
    global.smartApiAppConfigFilePath = configPath;
    global.smartApiRootPath = apiName;

    const smartApiApp = require("./smartApiApp");
    return smartApiApp;
};

if (process.env.NODE_ENV === "test") {
    const configPath = `${__dirname}/config`;
    smartapp = getSmartApiApp({ configPath });

    smartapp.listen(5000, () => {
        console.log("SmartAPI app is running on port 5000 for testing");
    });
}

module.exports = getSmartApiApp;
