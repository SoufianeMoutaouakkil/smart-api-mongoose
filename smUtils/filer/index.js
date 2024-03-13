const filerHelper = require("./helper");
const path = require("path");

const getFiler = (fileType) => {
    if (!fileType) fileType = "text";
    const filerPath = path.resolve(__dirname, `./${fileType}.filer.js`);
    if (!filerHelper.exists(filerPath))
        throw new Error(`SMFiler : File type ${fileType} not supported`);
    try {
        return require(`./${fileType}.filer`);
    } catch (e) {
        throw new Error(
            `SMFiler : Error loading ${fileType}.filer.js : ${e.message}`
        );
    }
};

module.exports = {
    getFiler,
};
