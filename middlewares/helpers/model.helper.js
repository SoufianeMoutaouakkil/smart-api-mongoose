const { getFiler } = require("../../smUtils/filer");
const { getSmartApiConfig } = require("./config.helper");
const { throwError } = require("../../smUtils/request");
const path = require("path");

const getTimestampsFields = (timestamps) => {
    if (timestamps) {
        return [
            "createdAt: { type: Date, immutable: true, default: Date.now }",
            "updatedAt: { type: Date, default: Date.now }",
        ];
    }
    return [];
};

const getTimestampsMethods = (timestamps) => {
    if (timestamps) {
        const content = [
            `entitySchema.pre("save", function (next) {`,
            `    if (this.isNew) {`,
            `        this.createdAt = Date.now();`,
            `    }`,
            `    this.updatedAt = Date.now();`,
            `    next();`,
            `});`,
        ];
        return content.join("\n");
    }
    return "";
};

const getFieldType = (type) => {
    type = type.toLowerCase();
    switch (type) {
        case "string":
            return "String";
            break;
        case "number":
            return "Number";
            break;
        case "date":
            return "Date";
            break;
        case "boolean":
            return "Boolean";
            break;
        case "objectid":
            return "mongoose.Schema.Types.ObjectId";
            break;
        case "array":
            return "Array";
            break;
        default:
            throw new Error(`Type ${type} is not supported as a field type`);
    }
};

const getDefaultValue = (value) => {
    if (typeof value === "string") return `default: "${value}",`;
    else if (typeof value === "number") return `default: ${value},`;
    else if (typeof value === "boolean") return `default: ${value},`;
    else if (typeof value === "object")
        return `default: ${JSON.stringify(value)},`;

    return "";
};

const getEntityContent = (config) => {
    let timestampsFields = getTimestampsFields(config?.timestamps);
    const fields = Object.keys(config.fields);
    let entityContent = `const mongoose = require("mongoose");\n\n`;
    entityContent += `const entitySchema = mongoose.Schema({\n`;
    entityContent += fields
        .map((fieldName) => {
            const field = config.fields[fieldName];
            let fieldContent = `${fieldName}: `;
            fieldContent += field.isArray ? "[{" : "{";
            if (field.type)
                fieldContent += `type : ${getFieldType(field.type)},`;
            if (field.ref) fieldContent += `ref: "${field.ref}",`;
            if (field.refPath) fieldContent += `refPath: "${field.refPath}",`;
            if (field.unique) fieldContent += "unique: true,";
            if (field.immutable) fieldContent += "immutable: true,";
            if (field.required) fieldContent += "required: true,";
            if (field.enum) fieldContent += `enum: [${field.enum}],`;
            if (field.default) fieldContent += getDefaultValue(field.default);
            if (field.minlength)
                fieldContent += `minlength: [${field.minlength}, "${field.name} min characters is ${field.minlength}!"],`;
            if (field.maxlength)
                fieldContent += `maxlength: [${field.maxlength}, "${field.name} max characters is ${field.maxlength}!"],`;
            if (field.validate)
                fieldContent += `validate: {${field.validate}},`;
            fieldContent += field.isArray ? "}]" : "}";
            return fieldContent;
        })
        .concat(timestampsFields);
    entityContent += "}\n";
    entityContent += `, { timestamps: ${config.timestamps} });`;
    return entityContent;
};

const getModelContent = (config, ressourceName) => {
    let modelContent = "";
    modelContent += getEntityContent(config);
    modelContent += "\n\n";
    modelContent += getTimestampsMethods(config?.timestamps);
    modelContent += "\n\n";
    modelContent += `module.exports = mongoose.model("${ressourceName}", entitySchema);`;
    modelContent += `\n`;

    return modelContent;
};

const getModelFilePath = (ressourceName) => {
    return path.resolve(__dirname, `../../models/${ressourceName}.model.js`);
};

const getJsFiler = () => {
    return getFiler("js");
};

const isModelAvailable = (modelPath) => {
    const filer = getJsFiler();
    return filer.exists(modelPath);
};

const createModel = async (ressourceName, ressourceSchemaConfig) => {
    const filer = getJsFiler();
    const modelPath = getModelFilePath(ressourceName);
    if (!ressourceSchemaConfig) {
        throwError(
            `Schema config for ${ressourceName} is not available`,
            "SCHEMA_CONFIG_NOT_AVAILABLE",
            400
        );
    }
    const modelContent = getModelContent(ressourceSchemaConfig, ressourceName);
    filer.write(modelPath, modelContent);
};

const getModel = async (ressourceName) => {
    const modelPath = getModelFilePath(ressourceName);
    if (!isModelAvailable(modelPath)) {
        const ressourceSchemaConfig = getSmartApiConfig(
            ressourceName,
            "schema"
        );
        await createModel(ressourceName, ressourceSchemaConfig);
        return require(modelPath);
    } else {
        return require(modelPath);
    }
};

const requireAvailableModels = async () => {
    const filer = getJsFiler();
    const modelsPath = path.resolve(__dirname, "../../models");
    const models = await filer.readDir(modelsPath);
    models.forEach((model) => {
        require(path.resolve(modelsPath, model));
    });
};

const generateNessearyModels = (fieldsPopulate) => {
    fieldsPopulate.forEach((field) => {
        const { resource } = field;
        getModel(resource);
    });
};

module.exports = {
    getModel,
    requireAvailableModels,
};
