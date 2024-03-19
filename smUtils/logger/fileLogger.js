const fs = require("fs");
const path = require("path");
const { addTabToEachLine } = require("./helper");
const { getEnvVar } = require("../env.util");

const getFilePathTime = (delay, currentTime = 0) => {
    if (isNaN(delay) || delay <= 0) {
        throw new Error("delay must be a positive number");
    } else if (isNaN(currentTime) || currentTime < 0) {
        throw new Error("currentTime must be a positive number");
    } else if (currentTime === 0) {
        currentTime = Date.now();
    }
    delay *= 1000;
    return (currentTime - (currentTime % delay)) / delay;
};

const isInNodemodules = (dirPath) => {
    const dirPathArr = dirPath.split(path.sep)
    const nodePathLevel = dirPathArr[dirPathArr.length - 3];
    return nodePathLevel === "node_modules";
};

const getLogPath = () => {
    const logDeley = getEnvVar("LOG_DELAY");
    const logFileTime = getFilePathTime(logDeley);
    const logFileTimeFormated = new Date(logFileTime * 1000)
        .toISOString()
        .replace(/:/g, "-");
    const logFileName = `log_${logFileTime}_${logFileTimeFormated}.log`;
    let logPath;
    if (!isInNodemodules(smartApiDirPath))
        logPath = path.join(smartApiDirPath, "smart-api-logs", logFileName);
    else
        logPath = path.join(
            smartApiDirPath,
            "..",
            "..",
            "..",
            "smart-api-logs",
            logFileName
        );

    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    if (!fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, "");
    }
    return logPath;
};

const saveLog = (logContent) => {
    const logPath = getLogPath();
    fs.appendFile(logPath, logContent, (err) => {
        if (err) {
            console.error(err);
        }
    });
};

const log = (logContent, nbTabs = 1) => {
    logContent = addTabToEachLine(logContent, nbTabs);

    saveLog(logContent);
};

module.exports = {
    log,
};
