const { getLogger } = require("../smUtils/logger");

const getFirstFileFromStack = (stack) => {
    const indicator = "  at ";
    const firstIndex = stack.indexOf(indicator);
    const secondIndex = stack.indexOf("\n", firstIndex + 1);

    return stack.substring(firstIndex + indicator.length, secondIndex);
};

const getErrorLogContent = (err) => {
    let message = "";
    message += `Error Message   : "${err.message}"\n`;
    message += `Error location  : "${getFirstFileFromStack(err.stack)}"\n`;
    message += `Error stack     : \n\${err.stack}\n`; // remove the \ to see the stack

    return message;
};

const logError = (err) => {
    const logger = getLogger();
    const message = getErrorLogContent(err);
    logger(message, "Internal Server Error");
};

const errorMiddleware = (err, req, res, next) => {
    logError(err);
    let message =
        "SMART API : An unexpected Internal Server Error occurred. Please check the server logs for more detailed information.";
    let code = "UNEXPECTED_INTERNAL_SERVER_ERROR";
    let item;
    let status = res.statusCode === 200 ? 500 : res.statusCode;
    status = err.status ?? status;
    if (err.code || status !== 500) {
        message = err.message;
        code = err.code;
        item = err.item;
    }

    res.status(status).json({ message, code, item, status: "FAIL" });
};

module.exports = errorMiddleware;
