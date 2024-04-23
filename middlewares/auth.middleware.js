const jwtUtil = require("../smUtils/jwt.util");
const { throwError } = require("../smUtils/request");
const isMockMode = false;
const asyncHandler = require("express-async-handler");

const authMiddleware = asyncHandler(async (req, res, next) => {
    const guestEnabled = process.env.GUEST_ENABLED === "true";
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
    let token = jwtUtil.getTokenFromAuthorization(authorization);
    if (!token && guestEnabled) {
        const randomId = Math.random().toString(36).substring(7);
        const email = `${randomId}@smart.api`;
        const guestUser = {
            _id: "guest",
            username: email,
            role: "guest",
            fullname: "guest",
        };
        token = jwtUtil.generateToken(guestUser);
        req.smartApi.user = token.payload;
        req.smartApi.token = token.token;
    } else if (token) {
        await jwtUtil
            .verifyToken(token)
            .then((data) => {
                if (!req.smartApi) req.smartApi = {};
                req.smartApi.user = data.payload;
                req.smartApi.token = data.token;
                next();
            })
            .catch((err) => {
                if (err.message === "jwt expired")
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
});

module.exports = authMiddleware;
