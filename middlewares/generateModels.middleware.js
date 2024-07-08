const {
    getConfigFileContent,
    getLastConfigUpdateDate,
} = require("./helpers/config.helper");
const { getModel } = require("./helpers/model.helper");

const fs = require("fs");
const path = require("path");

const removeOldModel = (modelName) => {
    const modelPath = path.join(
        smartApiDirPath,
        "models",
        `${modelName}.model.js`
    );
    if (fs.existsSync(modelPath)) {
        fs.unlinkSync(modelPath);
    }
};

const createModel = (modelName) => {
    getModel(modelName);
};

const mustUpdateModel = (modelName) => {
    const configUpdateDate = getLastConfigUpdateDate();
    const modelUpdateDate = getLastConfigUpdateDate(
        path.join(smartApiDirPath, "models", `${modelName}.model.js`)
    );

    return modelUpdateDate < configUpdateDate;
};

const createModelsDirIfNotExists = () => {
    const modelsDirPath = path.join(smartApiDirPath, "models");
    if (!fs.existsSync(modelsDirPath)) {
        fs.mkdirSync(modelsDirPath);
    }
};

const generateModels = (req, res, next) => {
    createModelsDirIfNotExists();
    fs.readdir(path.join(smartApiDirPath, "models"), (err, files) => {
        if (err) {
            console.error("Error while reading models directory", err);
            return res.status(500).send("Error while reading models directory");
        }
        const config = getConfigFileContent();
        const configuredModels = Object.keys(config);
        // debug_only
        // console.log("Configured models:", configuredModels);
        configuredModels.forEach((modelName) => {
            if (!files.includes(`${modelName}.model.js`)) {
                // debug_only
                // console.log(`Model "${modelName}" not found, creating it...`);
                createModel(modelName);
            } else if (mustUpdateModel(modelName)) {
                // debug_only
                // console.log(`Model "${modelName}" is outdated, updating it...`);
                removeOldModel(modelName);
                createModel(modelName);
            } else {
                // debug_only
                // console.log(`Model "${modelName}" is up to date`);
            }
        });
    });
    next();
};

module.exports = generateModels;
