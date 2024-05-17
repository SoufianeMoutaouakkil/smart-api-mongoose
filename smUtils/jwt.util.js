const jsonwebtoken = require("jsonwebtoken");
const { filter } = require("../smUtils/object.util");
const { getEnvVar } = require("./env.util");

const getJwtSecret = () => {
    return getEnvVar("JWT_SECRET");
};

const getJwtExpiration = () => {
    return getEnvVar("JWT_EXPIRATION");
};

const getPayloadFields = () => {
    const payloadFields = ["_id", "username", "role", "fullname"];
    return payloadFields;
};

const getTokenFromAuthorization = (authorization) => {
    if (authorization?.startsWith("Bearer ") && authorization.split(" ")[1]) {
        return authorization.split(" ")[1];
    }
    return null;
};

const getFilteredPayload = (payload) => {
    const payloadFields = getPayloadFields();
    let filteredPayload = {};
    if (payload) {
        filteredPayload = filter(payload, payloadFields);
    }
    return filteredPayload;
};

const generateToken = (payload) => {
    let token = {};
    payload = getFilteredPayload(payload);
    if (payload && Object.keys(payload).length !== 0) {
        token.payload = payload;
        token.token = jsonwebtoken.sign(payload, getJwtSecret(), {
            expiresIn: getJwtExpiration(),
        });
    }
    return token;
};

const verifyToken = (token) => {
    token = token ?? "";
    return new Promise((resolve, reject) => {
        jsonwebtoken.verify(token, getJwtSecret(), (error, payload) => {
            if (error) reject(error);
            else resolve(generateToken(payload));
        });
    });
};

module.exports = {
    generateToken,
    verifyToken,
    getTokenFromAuthorization,
};
