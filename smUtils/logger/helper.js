const LOG_LENGTH = 150;
const LOG_CHAR_MAIN = "#";
const LOG_CHAR_SEC = "*";

const addTabToEachLine = (content, nbTabs) => {
    if (typeof content !== "string") {
        throw new Error("addTabToEachLine : content must be a string");
    }
    if (isNaN(nbTabs) || nbTabs < 0) {
        throw new Error("addTabToEachLine : nbTabs must be a positive number");
    }
    if (nbTabs === 0) {
        return content;
    }
    const tab = "    ";
    const tabContent = tab.repeat(nbTabs);
    return content.replace(/\n/g, `\n${tabContent}`);
};

const getLogDel = (type = "main") => {
    const char = type === "main" ? LOG_CHAR_MAIN : LOG_CHAR_SEC;

    return char.repeat(LOG_LENGTH) + "\n";
};

const getLogLine = (content) => {
    let missedChars = LOG_LENGTH - 2 - content.length;
    missedChars = missedChars < 0 ? 0 : missedChars;

    return `${content}  ${LOG_CHAR_SEC.repeat(missedChars)}` + "\n";
};

const getFormattedMessage = (message) => {
    let formattedData = "";
    if (typeof message === "object") {
        formattedData += JSON.stringify(message, null, 2);
    } else {
        formattedData += message;
    }
    formattedData += "\n";

    return formattedData;
};

const getFormattedDate = () => {
    return new Date().toISOString();
};

const getLogTitle = (title) => {
    title = `${getFormattedDate()} - ${title ?? "Log Title"}`;
    let logTitle = getLogDel();
    logTitle += getLogLine(title);
    logTitle += getLogDel("sec");

    return logTitle;
};

const getLogBody = (message) => {
    let logBody = "";
    logBody += getLogLine("Body   :");
    logBody += getFormattedMessage(message);
    logBody += getLogDel();

    return logBody;
};

const getLogContent = (message, title = null) => {
    let logContent = "";
    logContent += getLogTitle(title);
    logContent += getLogBody(message);

    return logContent;
};

module.exports = {
    addTabToEachLine,
    getLogContent,
};
