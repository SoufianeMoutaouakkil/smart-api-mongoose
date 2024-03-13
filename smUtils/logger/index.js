const smFileLogger = require("./fileLogger");
const smDbLogger = require("./dbLogger");
const { getLogContent } = require("./helper");

const fileLogger = (message, title = null) => {
    const logContent = getLogContent(message, title);

    smFileLogger.log(logContent);
};

const dbLogger = (message, title = null) => {
    getLogContent(message, title, "db");
    // save to db
};

const consoleLogger = (message, title = null, type = "log") => {
    const logContent = getLogContent(message, title);
    switch (type) {
        case "log":
            console.log(logContent);
            break;
        case "error":
            console.error(logContent);
            break;
        case "warn":
            console.warn(logContent);
            break;
        default:
            console.log(logContent);
            break;
    }
};

const getLogger = (canal = null) => {
    switch (canal) {
        case "console":
            return consoleLogger;
        case "file":
            return fileLogger;
        case "db":
            return dbLogger;
        default:
            return consoleLogger;
    }
};

module.exports = { getLogger };
