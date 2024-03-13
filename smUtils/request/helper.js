const { ObjectId } = require("mongoose").Types;
const { getTrackedFunction, getTrackedExports } = require("../tracker.util");
const { getLogger } = require("../logger");
const { getDbQueryFromReqQuery } = require("./query");

const isVersionGiven = getTrackedFunction("isVersionGiven", (path) => {
    const pathParts = path.split("/");
    const version = pathParts[1].toUpperCase();
    return version.startsWith("V");
});

const getActionMode = getTrackedFunction(
    "getActionMode",
    (pathId, isByIds, isByQuery) => {
        if (pathId) return "ById";
        if (isByIds) return "ByIds";
        if (isByQuery) return "ByQuery";
        return "All";
    }
);

const getIdFromPath = (path) => {
    const pathParts = path.split("/");
    let id = null;
    pathParts.forEach((part) => {
        if (ObjectId.isValid(part)) {
            id = part;
        }
    });
    return id;
};

const getActionFromPath = (path) => {
    const pathParts = path.split("/");
    let action = isVersionGiven(path) ? pathParts[3] : pathParts[2];
    return action && !ObjectId.isValid(action) ? action.toLowerCase() : null;
};

const getResourceFromPath = (path) => {
    const pathParts = path.split("/");
    return isVersionGiven(path) ? pathParts[2] : pathParts[1];
};

const getReqIds = (queryIds, bodyIds) => {
    const ids = queryIds || bodyIds;
    let incomingIds = null;
    if (ids && typeof ids === "string") {
        incomingIds = ids.split(",");
    } else if (ids && Array.isArray(ids)) {
        incomingIds = ids;
    } else if (ids) {
        throw new Error("getReqIds : Invalid ids type");
    }

    if (!incomingIds) return null;

    incomingIds = incomingIds.map((id) => {
        if (!ObjectId.isValid(id)) {
            throw new Error("Invalid id : " + id);
        }
        return id;
    });

    return incomingIds;
};

const getReqQuery = (paramQuery, bodyQuery) => {
    let query = bodyQuery || paramQuery;
    if (query && typeof query === "string") {
        try {
            query = JSON.parse(query);
        } catch (e) {
            throw new Error("Invalid string query : " + e.message);
        }
    }
    if (query && typeof query === "object") {
        try {
            query = getDbQueryFromReqQuery(query);
        } catch (e) {
            throw new Error("Invalid object query : " + e.message);
        }
    } else if (query) {
        throw new Error("Invalid query type");
    }
    return query;
};

const getSmartApiAction = (method, pathAction, pathId, queryParams, body) => {
    if (pathAction && pathAction !== "many") return pathAction;
    const isByQuery = queryParams?.query || body?.query;
    const isByIds = queryParams?.ids || body?.ids;
    let smartApiAction = "";
    const actionMode = getActionMode(pathId, isByIds, isByQuery);
    switch (method) {
        case "GET":
            smartApiAction = `get${actionMode}`;
            break;
        case "POST":
            if (body?.data && Array.isArray(body.data)) smartApiAction = "createMany";
            else smartApiAction = "create";
            break;
        case "PUT":
            smartApiAction = `update${actionMode}`;
            break;
        case "DELETE":
            smartApiAction = `remove${actionMode}`;
            break;
        default:
            smartApiAction = "UNKNOWN";
    }

    return smartApiAction;
};

module.exports = getTrackedExports({
    getIdFromPath,
    getActionFromPath,
    getResourceFromPath,
    getReqIds,
    getReqQuery,
    getSmartApiAction,
});
