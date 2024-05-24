const removeModels = (req, res, next) => {
    const removeModels = process.env.MODELS_AUTO_REMOVE;
    if (removeModels === "true") {
        const fs = require("fs");
        const path = require("path");
        const modelsPath = path.join(smartApiDirPath, "models");
        fs.readdir(modelsPath, (err, files) => {
            if (err) {
                console.error("Error reading models directory: ", err);
                return;
            }
            files.forEach((file) => {
                if (file.includes("model")) {
                    fs.unlink(path.join(modelsPath, file), (err) => {
                        if (err) {
                            console.error(
                                `Error removing model ${file}: `,
                                err
                            );
                            return;
                        }
                    });
                }
            });
        });
    }
    next();
};

module.exports = removeModels;
