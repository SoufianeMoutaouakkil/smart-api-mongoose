const { getEnvVar } = require("./env.util");
const { getLogger } = require("./logger");

const log = (data, funcName) => {
    let logger;
    const logType = getEnvVar("LOG_TYPE");
    if (logType === "file") {
        logger = getLogger("file");
    } else {
        logger = getLogger();
    }
    logger(data, funcName);
};

const validateGetTrackedFunction = (funcName, func) => {
    if (typeof funcName !== "string") {
        throw new Error("funcName must be a string");
    }
    if (typeof func !== "function") {
        throw new Error("func must be a function");
    }
};

const getTrackedFunction = (funcName, func) => {
    validateGetTrackedFunction(funcName, func);
    return function () {
        let error;
        let output;
        try {
            output = func.apply(this, arguments);
        } catch (e) {
            error = e;
        }
        log({ input: arguments, output, error }, funcName);
        if (error) {
            throw error;
        } else {
            return output;
        }
    };
};

const getTrackedAsyncFunction = (funcName, func) => {
    validateGetTrackedFunction(funcName, func);
    return async function () {
        let error;
        let output;
        try {
            output = await func.apply(this, arguments);
        } catch (e) {
            error = e;
        }
        log({ input: arguments, output, error }, funcName);
        if (error) {
            throw error;
        } else {
            return output;
        }
    };
};

const getTrackedExports = (exports) => {
    const trackedExports = {};
    for (const key in exports) {
        if (typeof exports[key] === "function") {
            trackedExports[key] = getTrackedFunction(key, exports[key]);
        } else {
            trackedExports[key] = exports[key];
        }
    }
    return trackedExports;
};

module.exports = {
    getTrackedFunction,
    getTrackedAsyncFunction,
    getTrackedExports,
};
