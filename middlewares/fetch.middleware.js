const expressAsyncHandler = require("express-async-handler");
const { throwError } = require("../smUtils/request");
const {
    validateQueryItems,
    resolveQueryItemValue,
} = require("./helpers/query.helper");
const {
    getDbQueryFromReqQuery,
    evaluateQueryItem,
} = require("./helpers/query.helper");
const { getLogger } = require("../smUtils/logger");
const logger = getLogger("file");

const mustFetch = (action) => {
    if (!action) {
        return false;
    }
    const fetchingActionsStarts = ["get", "update", "remove", "count"];
    return fetchingActionsStarts.some((fetchingAction) =>
        action.startsWith(fetchingAction)
    );
};

const getInitFetchQuery = (params) => {
    if (params.id) return { _id: params.id };
    if (params.query) return params.query;
    if (params.ids) return { _id: { $in: params.ids } };
    return {};
};

const validateConfigQueryItems = (queryFilter, user) => {
    let query = [];
    const validatedQueryFilter = validateQueryItems(queryFilter);
    validatedQueryFilter.forEach((queryItem) => {
        queryItem.value = resolveQueryItemValue(user, queryItem.value);
        query.push(queryItem);
    });

    return query;
};

const getAuthorizedFetchQuery = (queryFilter, user) => {
    let query = validateConfigQueryItems(queryFilter, user);
    query = getDbQueryFromReqQuery(query);

    return query;
};

const getFetchQuery = (user, params, queryFilter) => {
    let fetchQuery = {};
    const initQuery = getInitFetchQuery(params);
    if (params.ids || params.id || !queryFilter) {fetchQuery = initQuery;}
    else {const authorizedQuery = getAuthorizedFetchQuery(queryFilter, user);
        fetchQuery = { ...initQuery, ...authorizedQuery};
    }
    logger({
        user,
        params,
        queryFilter,
        output: fetchQuery,
    }, "getFetchQuery");
    return fetchQuery;
};

const getFiltredData = (dbData, ressourceFilter, user) => {
    if (!ressourceFilter) return dbData;
    ressourceFilter = validateConfigQueryItems(ressourceFilter, user);
    const filtredData = dbData.filter((record) => {
        let isAuthorized = true;
        ressourceFilter.forEach((item) => {
            const isOk = evaluateQueryItem(record, item);
            if (!isOk) isAuthorized = false;
        });
        return isAuthorized;
    });
    return filtredData;
};

const validateDataNumberForIdsMode = (dbData, ids, id, typeError) => {
    const status = typeError === "not_found" ? 404 : 403;
    let message =
        typeError === "not_found"
            ? "data not found with "
            : "Not authorized to access the data with ";
    const code =
        typeError === "not_found" ? "DATA_NOT_FOUND" : "NOT_AUTHORIZED";
    let isOK = true;
    if (ids && dbData.length !== ids.length) {
        const missedIds = ids.filter(
            (id) => !dbData.find((data) => data._id == id)
        );
        message += `ids: ${missedIds.join(", ")}`;
        isOK = false;
    }
    if (id && dbData.length === 0) {
        message += `id: ${id}`;
        isOK = false;
    }
    if (!isOK) {
        throwError(message, code, status);
    }
};

const fetchMiddleware = expressAsyncHandler(async (req, res, next) => {
    const { user, params, config } = req.smartApi;
    if (mustFetch(params.action)) {
        const model = req.smartApi.model;
        const { fieldsPopulate, queryFilter, ressourceFilter } = config;
        const { id, ids } = params;

        // get the query to fetch the data using the params and the config[queryFilter]
        const query = getFetchQuery(user, params, queryFilter);
        if (!model || !query) {
            throwError("missing model or query", "MODEL_OR_QUERY_MISSING");
        }
        let dbData = await model.find(query);

        // check if all the ids were found in the database
        validateDataNumberForIdsMode(dbData, ids, id, "not_found");

        // populate the data if needed [fieldsPopulate]
        if (dbData.length !== 0 && fieldsPopulate)
            dbData = await model.populate(dbData, config.fieldsPopulate);

        // filter dbData if needed [ressourceFilter]
        if (dbData.length !== 0 && ressourceFilter)
            dbData = getFiltredData(dbData, ressourceFilter, user);

        // check if the user is authorized to access the data if id or ids are used
        validateDataNumberForIdsMode(dbData, ids, id, "not_authorized");

        if (params.id) {
            dbData = dbData[0];
        }

        req.smartApi.dbData = dbData;
    }

    logger(req.smartApi.dbData, "fetchMiddleware: req.smartApi.dbData:");
    next();
});

module.exports = fetchMiddleware;
