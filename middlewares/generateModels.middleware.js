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

const removeModels = (req, res, next) => {
    fs.readdir(path.join(smartApiDirPath, "models"), (err, files) => {
        if (err) {
            console.error("Error while reading models directory", err);
            return res.status(500).send("Error while reading models directory");
        }
        const config = getConfigFileContent();
        const configuredModels = Object.keys(config);
        configuredModels.forEach((modelName) => {
            if (!files.includes(`${modelName}.model.js`)) {
                createModel(modelName);
            } else if (mustUpdateModel(modelName)) {
                removeOldModel(modelName);
                createModel(modelName);
            }
        });
    });
    next();
};

module.exports = removeModels;
