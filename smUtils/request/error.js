const throwError = (
    message,
    code = "UNKNOWN_ERROR_CODE",
    status = 500,
    item = undefined
) => {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    err.item = item;
    throw err;
};

module.exports = {
    throwError,
};
