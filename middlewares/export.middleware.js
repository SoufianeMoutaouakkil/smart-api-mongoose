const { ObjectId } = require("mongoose").Types;
const { throwError } = require("../smUtils/request");

const mustExport = (params) => {
    return (
        params.isExmode &&
        params.format &&
        ["getByIds", "getByQuery", "getAll"].includes(params.action)
    );
};

const updateHeaders = (headers, itemKeys) => {
    if (!headers) {
        return itemKeys;
    }
    return headers.concat(itemKeys.filter((key) => !headers.includes(key)));
};

const getKeys = (obj) => {
    let keys = Object.keys(obj);
    keys = keys.filter((key) => {
        return ["_doc", "__v", "$__"].indexOf(key) === -1;
    });
    return keys;
};

const getItemKeyVal = (item, key) => {
    let itemKeyVal;
    if (!item[key]) {
        itemKeyVal = "";
    } else if (ObjectId.isValid(item[key])) {
        if (item[key].toObject) {
            let nestedObject = item[key].toObject();
            if (nestedObject._id) delete nestedObject._id;
            itemKeyVal = JSON.stringify(nestedObject);
        } else {
            itemKeyVal = item[key].toString();
        }
    } else if (item[key] instanceof Array) {
        itemKeyVal = item[key].join(", ");
    } else if (item[key] instanceof Date) {
        itemKeyVal = item[key].toISOString();
        // check for ObjectId
    } else if (item[key]._id) {
        itemKeyVal = item[key]._id;
    } else if (typeof item[key] === "object") {
        itemKeyVal = JSON.stringify(item[key]);
    } else {
        itemKeyVal = item[key];
    }

    return itemKeyVal;
};

const getExcelData = (data) => {
    let excelData = [];
    if (data.length === 0) {
        return excelData;
    }
    data.forEach((item) => {
        let row = [];
        const record = item.toObject ? item.toObject() : item;
        const itemKeys = getKeys(record);

        excelData[0] = updateHeaders(excelData[0], itemKeys);
        excelData[0].forEach((header) => {
            row.push(getItemKeyVal(item, header));
        });
        excelData.push(row);
    });
    return excelData;
};

const getCsvData = (data) => {
    let csvData = [];
    if (data.length === 0) {
        return csvData;
    }
    data.forEach((item) => {
        const record = item.toObject ? item.toObject() : item;
        if (record["__v"] !== undefined) delete record["__v"];
        csvData.push(record);
    });
    return csvData;
};

const getFileData = (data, format) => {
    if (format === "excel") {
        return getExcelData(data);
    } else if (format === "csv") {
        return getCsvData(data);
    } else if (format === "json") {
        return data;
    } else {
        return throwError(
            `Format not supported : ${format}`,
            "INVALID_FORMAT",
            400
        );
    }
};

const getFileBinary = (fileData, format) => {
    if (format === "excel") {
        const excel = require("node-xlsx");
        const excelBuffer = excel.build([{ name: "Sheet1", data: fileData }]);
        return excelBuffer;
    } else if (format === "csv") {
        const { Parser } = require("json2csv");
        const parser = new Parser({ delimiter: ";" });
        const csv = parser.parse(fileData);
        return Buffer.from(csv);
    } else if (format === "json") {
        return Buffer.from(JSON.stringify(fileData));
    } else {
        throwError(`Format not supported : ${format}`, "INVALID_FORMAT", 400);
    }
};

const getFileName = (ressourceName, format) => {
    format = format === "excel" ? "xlsx" : format;
    const fileName = `export_${ressourceName}_${new Date().toISOString()}.${format}`;
    return fileName;
};

const exportMiddleware = (req, res, next) => {
    if (mustExport(req.smartApi?.params)) {
        const { format, ressourceName } = req.smartApi.params;
        const dbData = req.smartApi.dbData;
        // get file data
        let fileData = getFileData(dbData, format);
        let fileBinary = getFileBinary(fileData, format);
        // send file
        const fileName = getFileName(ressourceName, format);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${fileName}`
        );
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Transfer-Encoding", "binary");
        res.setHeader("Content-Length", fileBinary.length);
        res.send(fileBinary);

        return;
    }
    next();
};

module.exports = exportMiddleware;
