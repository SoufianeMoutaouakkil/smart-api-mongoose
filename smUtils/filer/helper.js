const fs = require("fs");
const path = require("path");

const getLastUpdateDate = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return stats.mtime;
    } catch (error) {
        console.error(`Getting last update date for "${filePath}" failed: ${error.message}`);
        return null;
    }
};

const exists = (path) => {
    try {
        return fs.existsSync(path);
    } catch (error) {
        return false;
    }
};

const write = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, data, "utf8");
    } catch (error) {
        throw new Error(`Error writing in file: ${error.message}`);
    }
};

const create = (filePath) => {
    const fileDir = path.dirname(filePath);
    if (!exists(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
    }
    fs.closeSync(fs.openSync(filePath, "w"));
    return true;
};

const readDir = (dirPath) => {
    try {
        return fs.readdirSync(dirPath);
    } catch (error) {
        throw new Error(`Error reading directory: ${error.message}`);
    }
};

module.exports = {
    exists,
    write,
    create,
    readDir,
    getLastUpdateDate,
};
