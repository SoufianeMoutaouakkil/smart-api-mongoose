const fs = require("fs");
const excel = require("node-xlsx");
const read = (filePath, sheetIndex = 0) => {
    const data = fs.readFileSync(filePath);
    const workSheetsFromBuffer = excel.parse(data);

    const sheet = workSheetsFromBuffer[sheetIndex];
    if (!sheet) {
        console.error("Sheet not found");
        return;
    }
    const jsonData = excelSheetDataToJson(sheet.data);
    return jsonData;
};

const excelSheetDataToJson = (data) => {
    const headers = data[0];

    const jsonData = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const obj = {};
        for (let j = 0; j < row.length; j++) {
            if (headers[j]) obj[headers[j]] = row[j];
        }
        jsonData.push(obj);
    }
    return jsonData;
};

module.exports = {
    read,
};
