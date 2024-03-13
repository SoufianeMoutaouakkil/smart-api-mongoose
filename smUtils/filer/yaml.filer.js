const fs = require("fs");
const jsyaml = require("js-yaml");
const filerHelper = require("./helper");

const read = (filePath) => {
    const fileExists = filerHelper.exists(filePath);
    if (!fileExists) {
        throw new Error(`YamlFiler : File ${filePath} does not exist`);
    }
    try {
        const yamlFileContent = fs.readFileSync(filePath, "utf8");

        let data = jsyaml.load(yamlFileContent);
        if (data === undefined) {
            data = {};
        }
        return data;
    } catch (error) {
        throw new Error(
            `YamlFiler : Error reading YAML file: ${error.message}`
        );
    }
};

const write = (filePath, data) => {
    const yamlFileContent = jsyaml.dump(data);
    if (filePath && !filePath.endsWith(".yaml") && !filePath.endsWith(".yml"))
        filePath += ".yaml";
    filerHelper.write(filePath, yamlFileContent);
};

module.exports = {
    read,
    write,
    exists: filerHelper.exists,
};
