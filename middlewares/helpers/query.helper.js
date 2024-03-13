const { getTrackedExports } = require("../../smUtils/tracker.util");
const { throwError } = require("../../smUtils/request");

const throwQueryError = (message, item = undefined) => {
    message = message ? "Invalid query : " + message : "Invalid query";

    throwError(message, "INVALID_QUERY", 400, item ?? "undefined_item");
};

const isAllowedOperator = (operator) => {
    return (
        ["eq", "ne"].includes(operator) ||
        ["or", "and"].includes(operator) ||
        ["gt", "lt", "gte", "lte"].includes(operator) ||
        ["in", "nin"].includes(operator) ||
        ["exists", "notexists"].includes(operator) ||
        ["regex"].includes(operator)
    );
};

const validateQueryItem = (item) => {
    if (typeof item !== "object")
        throwQueryError("query item should be object", item);
    let { field, value, operator } = item;
    if (operator) operator = operator.toLowerCase();
    if (!field && !["or", "and"].includes(operator))
        throwQueryError("field is required with not OR/AND operators", item);
    if (!value && ["or", "and"].includes(operator))
        throwQueryError("value is required for logical operators", item);
    if (field) {
        if (typeof field !== "string")
            throwQueryError("field should be string", item);
        if (!value) {
            if (!operator) operator = "exists";
            else if (!["exists", "notexists"].includes(operator))
                throwQueryError("value is required", item);
        } else if (!operator) {
            operator = "eq";
        } else if (!isAllowedOperator(operator)) {
            throwQueryError("invalid operator", item);
        }
    } else {
        if (!["or", "and"].includes(operator))
            throwQueryError(
                "field is required for non-logical operators",
                item
            );
        if (!value || !Array.isArray(value))
            throwQueryError(
                "value should be array for logical operators",
                item
            );
    }
    return { field, value, operator };
};

const validateQueryItems = (query) => {
    if (!query || typeof query !== "object")
        throwQueryError("query is required as object [objects]!", query);
    if (!Array.isArray(query)) query = [query];
    let validatedQueryItems = [];
    query.forEach((item) => {
        validatedQueryItems.push(validateQueryItem(item));
    });
    return validatedQueryItems;
};

const evaluateQueryItem = (object, item) => {
    const { field, value, operator } = item;
    const fieldValue = resolveObjectValue(object, field);
    switch (operator) {
        case "eq":
            return fieldValue === value;
        case "regex":
            return fieldValue.match(new RegExp(value, "i")) !== null;
        case "exists":
            return fieldValue !== undefined;
        case "notexists":
            return fieldValue === undefined;
        case "gt":
            return fieldValue > value;
        case "lt":
            return fieldValue < value;
        case "gte":
            return fieldValue >= value;
        case "lte":
            return fieldValue <= value;
        case "ne":
            return fieldValue !== value;
        case "in":
            return value.includes(fieldValue);
        case "nin":
            return !value.includes(fieldValue);
        default:
            return false;
    }
};

const resolveObjectValue = (object, path) => {
    if (typeof path !== "string")
        throwError("path should be string", "INVALID_PATH");
    if (!path.includes(".")) return object[path];
    const pathArray = path.split(".");
    let value = object;
    pathArray.forEach((field) => {
        value = value[field];
    });

    return value;
};

const resolveQueryItemValue = (object, value) => {
    if (typeof value !== "string" || !value.startsWith("smapiuser@"))
        return value;

    const field = value.split("@")[1];
    return resolveObjectValue(object, field);
};

const getDbQueryFromReqQuery = (reqQuery) => {
    const query = {};
    if (!reqQuery || typeof reqQuery !== "object")
        throwQueryError("query is required as object [objects]!", reqQuery);
    if (!Array.isArray(reqQuery)) reqQuery = [reqQuery];
    const validatedQueryItems = validateQueryItems(reqQuery);
    validatedQueryItems.forEach((item) => {
        const { field, value, operator } = item;
        switch (operator) {
            case "eq":
                query[field] = value;
                break;
            case "regex":
                if (typeof value !== "string")
                    throwQueryError(
                        "value should be string for regex operator"
                    );
                query[field] = { $regex: new RegExp(value, "i") };
                break;
            case "exists":
                query[field] = { $exists: true };
                break;
            case "notexists":
                query[field] = { $exists: false };
                break;
            case "gt":
                query[field] = { $gt: value };
                break;
            case "lt":
                query[field] = { $lt: value };
                break;
            case "gte":
                query[field] = { $gte: value };
                break;
            case "lte":
                query[field] = { $lte: value };
                break;
            case "ne":
                query[field] = { $ne: value };
                break;
            case "in":
                query[field] = { $in: value };
                break;
            case "nin":
                query[field] = { $nin: value };
                break;
            case "or":
                query["$or"] = value.map((val) => {
                    return getDbQueryFromReqQuery(val);
                });
                break;
            case "and":
                query["$and"] = value.map((val) => {
                    return getDbQueryFromReqQuery(val);
                });
                break;
            default:
                break;
        }
    });
    return query;
};

module.exports = {
    ...getTrackedExports({
        validateQueryItems,
        evaluateQueryItem,
        getDbQueryFromReqQuery,
        resolveQueryItemValue,
    }),
};
