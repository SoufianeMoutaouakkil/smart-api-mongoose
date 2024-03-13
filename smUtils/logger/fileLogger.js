const fs = require("fs");
const path = require("path");
const { addTabToEachLine } = require("./helper");

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

const getLogPath = () => {
    logDeley = process.env.LOG_DELAY ?? 3600;
    const logFileTime = getFilePathTime(logDeley);
    const logFileName = `log_${logFileTime}.log`;
    const logPath = path.join(appRoot, "logs", logFileName);
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
