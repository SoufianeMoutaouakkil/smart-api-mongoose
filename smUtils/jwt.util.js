const jsonwebtoken = require("jsonwebtoken");
const { filter } = require("../smUtils/object.util");

const getPayloadFields = () => {
    const payloadFields = ["_id", "email", "role", "fullname"];
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
        token.token = jsonwebtoken.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
    }
    return token;
};

const verifyToken = (token) => {
    token = token ?? "";
    return new Promise((resolve, reject) => {
        jsonwebtoken.verify(token, process.env.JWT_SECRET, (error, payload) => {
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
