const filerHelper = require("./helper");

const read = (filePath) => {
    const fileExists = filerHelper.exists(filePath);
    if (!fileExists) {
        throw new Error(`JSFiler : File ${filePath} does not exist`);
    }
    try {
        const yamlFileContent = fs.readFileSync(filePath, "utf8");

        if (data === undefined) {
            data = "";
        }
        return data;
    } catch (error) {
        throw new Error(`JSFiler : Error reading JS file: ${error.message}`);
    }
};

const write = (filePath, data) => {
    if (filePath && !filePath.endsWith(".js")) filePath += ".js";
    create(filePath);
    filerHelper.write(filePath, data);
};

const create = (filePath) => {
    if (filePath && !filePath.endsWith(".js")) filePath += ".js";
    return filerHelper.create(filePath);
};

module.exports = {
    read,
    write,
    exists: filerHelper.exists,
    readDir: filerHelper.readDir,
};
