const {
    getIdFromPath,
    getActionFromPath,
    getResourceFromPath,
    getReqIds,
    getReqQuery,
    getSmartApiAction,
} = require("./helper");
const { throwError } = require("./error");

const { getTrackedExports } = require("../tracker.util");

const getReqParams = (method, path, queryParams, body) => {
    const pathId = getIdFromPath(path) ?? undefined;
    const pathAction = getActionFromPath(path);
    const pathResource = getResourceFromPath(path);
    const smartApiAction = getSmartApiAction(
        method,
        pathAction,
        pathId,
        queryParams,
        body
    );
    const smartApiIds = getReqIds(queryParams?.ids, body?.ids) ?? undefined;
    const smartApiQuery =
        getReqQuery(queryParams?.query, body?.query) ?? undefined;
    if (
        (smartApiIds && pathId) ||
        (smartApiIds && smartApiQuery) ||
        (pathId && smartApiQuery)
    ) {
        throwError(
            "Request can't have more than one of these parameters: id, ids, query",
            "INVALID_REQUEST",
            400
        );
    }
    const isExmode = queryParams?.export === "true" ? true : undefined;
    const isImmode = smartApiAction === "import" ? true : undefined;
    let format;
    if (isExmode) {
        format = queryParams?.format || "excel";
    }
    if (isImmode) {
        format = queryParams?.format;
    }
    return {
        action: smartApiAction,
        ressourceName: pathResource,
        id: pathId,
        ids: smartApiIds,
        query: smartApiQuery,
        isExmode,
        isImmode,
        format,
    };
};

module.exports = getTrackedExports({
    getReqParams,
    throwError,
});
