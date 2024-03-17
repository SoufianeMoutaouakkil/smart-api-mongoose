const path = require("path");
const asyncHandler = require("express-async-handler");

const jwt = require(path.join(appRoot, "utils", "jwt"));
const User = require(path.join(appRoot, "models", "usersModel"));
const { getFbClient } = require(path.join(appRoot, "services", "facebook"));
const logger = require(path.join(appRoot, "utils", "tools")).logger.log();
const errorUtil = require(path.join(appRoot, "utils", "tools")).errorUtil;
const { authErrors } = require(path.join(appRoot, "config", "errorCodes"));

const authorize = asyncHandler(async (req, res) => {
    const redirect_uri = req.body.redirect_uri;
    const logTitle = "Facebook Oauth : authorize";

    if (!redirect_uri) {
        throw errorUtil.generateError(authErrors.login.fields.missed);
    }

    const fbClient = getFbClient(redirect_uri);
    const authorizationUrl = fbClient.getAuthorizationUrl();

    logger.log("authorization url : " + authorizationUrl, logTitle);

    res.send({ url: authorizationUrl });
});

const callback = asyncHandler(async (req, res, next) => {
    const code = req.body.code;
    const redirect_uri = req.body.redirect_uri || getFacebookRedirectUrl(req);
    const logTitle = "Facebook Oauth : callback";

    if (!redirect_uri || !code) {
        throw errorUtil.generateError(authErrors.login.fields.missed);
    }

    logger.log("callback code : " + code.substring(0, 30), logTitle);
    logger.log("callback redirect_uri : " + redirect_uri, logTitle);

    const oAuth2Client = getFbClient(redirect_uri);
    const accessToken = await oAuth2Client.getAccessToken(code);
    const userData = await oAuth2Client.getUserData(accessToken);

    let user;
    user = await User.findOne({
        providerId: userData.id,
        provider: "facebook",
    });

    if (!user && userData.id) {
        user = await User.create({
            provider: "facebook",
            providerId: userData.id,
            email: userData.email,
            fullname: userData.name,
            isCompleted: false,
        });
    }

    let data = {
        user,
        status: "SUCCESS",
        token: jwt.generateToken(user).token,
    };

    logger.log("callback response data : " + JSON.stringify(data), logTitle);
    res.send(data);
});

module.exports = { authorize, callback };
