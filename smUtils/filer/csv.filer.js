const read = async (filePath) => {
    const csv = require("csvtojson");
    return await csv({delimiter: ";"}).fromFile(filePath);
};

const write = (filePath, data) => {
};

module.exports = {
    read,
    write,
};
