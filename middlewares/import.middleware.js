const { throwError } = require("../smUtils/request");
const { getFiler } = require("../smUtils/filer");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const getBodyData = (data) => {
    if (Array.isArray(data)) {
        return data;
    } else {
        return [data];
    }
};

const removeFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
};

const getDataFromFile = async (filePath, format) => {
    let bodyData;
    try {
        if (format === "xlsx" || format === "xls") {
            format = "excel";
        }
        const filer = getFiler(format);
        if (!filer?.read) {
            return null;
        }
        const data = await filer.read(filePath);
        bodyData = getBodyData(data);
    } catch (error) {
        console.error("Error while reading file", error);
    }
    removeFile(filePath);
    return bodyData;
};

const importMiddleware = asyncHandler(async (req, res, next) => {
    if (req.smartApi?.params?.action === "import") {
        // check if file is present
        if (!req.smartApi.file) {
            throwError("No file uploaded", "NO_FILE_UPLOADED", 400);
        }
        const file = req.smartApi.file;
        let format = req.smartApi?.params?.format;
        if (!format) {
            format = file.originalname.split(".").pop();
        }
        const data = await getDataFromFile(file.path, format);
        if (!data) {
            throwError("Invalid file format", "INVALID_FILE_FORMAT", 400);
        }
        req.smartApi.bodyData = data;
        req.smartApi.file = null;
        req.smartApi.params.action = "createMany";
    }
    next();
});

module.exports = importMiddleware;
