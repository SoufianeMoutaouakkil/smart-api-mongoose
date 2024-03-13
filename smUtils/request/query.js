const { throwError } = require("./error");
const { getTrackedFunction } = require("../tracker.util");

const getdbQueryItem = (item) => {
    const { field, value, operator } = getReqQueryItemParams(item);
    let query = {};
    switch (operator) {
        case "eq":
            query[field] = value;
            break;
        case "regex":
            query[field] = { $regex: value };
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
        case "and":
            query["$" + operator] = value.map((val) => {
                return getDbQueryFromReqQuery(val);
            });
            break;
        default:
            throwError(`Invalid operator: ${operator}`, "INVALID_OPERATOR");
            break;
    }
    return query;
};

const validateReqQuery = (reqQuery) => {
    if (reqQuery && typeof reqQuery !== "object") {
        throwError("Invalid query", "INVALID_QUERY");
    }

    if (
        !reqQuery ||
        (Array.isArray(reqQuery) && reqQuery.length === 0) ||
        Object.keys(reqQuery).length === 0
    ) {
        return null;
    }

    if (!Array.isArray(reqQuery)) {
        return [reqQuery];
    }
    return reqQuery;
};

const validateFieldAndOperator = (field, operator) => {
    if (
        (field && typeof field !== "string") ||
        (operator && typeof operator !== "string")
    ) {
        throwError(
            "Invalid query item. operator and field must be absent or string",
            "INVALID_QUERY_ITEM"
        );
    }
};

const getReqQueryItemParams = (item) => {
    let { field, value, operator } = item;
    validateFieldAndOperator(field, operator);

    if (!field) {
        if (!operator) {
            // if no field and no operator, then it's not a valid query item
            throwError(
                "Invalid query item : " +
                    JSON.stringify(item) +
                    " : field and operator are missed!"
            );
        } else if (!["or", "and"].includes(operator)) {
            // if no field and operator is not 'or' or 'and', then it's not a valid query item
            throwError(
                "Invalid query item : " +
                    JSON.stringify(item) +
                    " : field is required for operator different than 'or' or 'and'",
                "INVALID_QUERY_ITEM"
            );
        } else if (!value || typeof value !== "object") {
            // if no field and operator is 'or' or 'and' and no value or not object, then it's not a valid query item
            throwError(
                "Invalid query item : " +
                    JSON.stringify(item) +
                    " : value is required for 'or' or 'and' operator and must be an object",
                "INVALID_QUERY_ITEM"
            );
        }
    } else if (!value) {
        if (!operator) {
            // if field and no value and no operator, then operator is 'exists'
            operator = "exists";
        } else if (!["exists", "notexist"].includes(operator.toLowerCase())) {
            // if field and no value and operator is different than 'exists' or 'notexists', then it's not a valid query item
            throwError(
                "Invalid query item : " +
                    JSON.stringify(item) +
                    " : value is required for operator different than 'exists' or 'notexists'",
                "INVALID_QUERY_ITEM"
            );
        }
    } else if (!operator) {
        // if field and value and no operator, then operator is 'eq'
        operator = "eq";
    }

    return { field, value, operator };
};

const getDbQueryFromReqQuery = getTrackedFunction(
    "getDbQueryFromReqQuery",
    (reqQuery) => {
        let query = {};
        reqQuery = validateReqQuery(reqQuery);
        if (!reqQuery) return query;
        reqQuery.forEach((item) => {
            query = {
                ...query,
                ...getdbQueryItem(item),
            };
        });
        return query;
    }
);

module.exports = {
    getDbQueryFromReqQuery,
};
