const jwtUtil = require("../smUtils/jwt.util");
const { throwError } = require("../smUtils/request");
const isMockMode = true;

const authMiddleware = async (req, res, next) => {
    if (!req.smartApi) req.smartApi = {};
    if (isMockMode) {
        req.smartApi.user = {
            _id: "60e5e9e8d8b1e0f3b0e6c3b9",
            email: "email@smart.api",
            role: "user",
            fullname: "user",
            isActive: true,
        };
        req.smartApi.token = "mocked-token";
        next();
        return;
    }
    const authorization =
        req.headers["authorization"] || req.headers["Authorization"];
    const token = jwtUtil.getTokenFromAuthorization(authorization);

    if (token) {
        await jwtUtil
            .verifyToken(token)
            .then((data) => {
                if (!req.smartApi) req.smartApi = {};
                req.smartApi.user = data.payload;
                req.smartApi.token = data.token;
                next();
            })
            .catch((err) => {
                errorMessage = err.message;
                if (errorMessage === "jwt expired")
                    throwError(
                        "Unauthorized : token expired!",
                        "TOKEN_EXPIRED",
                        401
                    );
                else
                    throwError(
                        "Unauthorized : invalid token!",
                        "INVALID_TOKEN",
                        401
                    );
            });
    } else {
        throwError(
            "Unauthorized : no token provided in authorization header!",
            "NO_TOKEN_PROVIDED",
            401
        );
    }
};

module.exports = authMiddleware;
