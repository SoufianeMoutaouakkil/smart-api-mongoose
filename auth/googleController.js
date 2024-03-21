const path = require("path");
const asyncHandler = require("express-async-handler");

const User = require(path.join(appRoot, "models", "usersModel"));
const { getGoogleClient } = require(path.join(appRoot, "services", "google"));
const jwt = require(path.join(appRoot, "utils", "jwt"));
const logger = require(path.join(appRoot, "utils", "tools")).logger.log();
const errorUtil = require(path.join(appRoot, "utils", "tools")).errorUtil;
const { authErrors } = require(path.join(appRoot, "config", "errorCodes"));

const fetchUserData = async (access_token) => {
    const userDataUrl = process.env.GOOGLE_URL_USER_DATA;
    const response = await fetch(`${userDataUrl}?access_token=${access_token}`);

    const data = await response.json();
    const dataString = JSON.stringify(data);
    logger.log(
        "Google user data fetched: " + dataString,
        "Google Oauth : fetchUserData"
    );
    return data;
};

const authorize = asyncHandler(async (req, res) => {
    const redirect_uri = req.body.redirect_uri;

    if (!redirect_uri) {
        throw errorUtil.generateError(authErrors.login.fields.missed);
    }

    const googleClient = getGoogleClient(redirect_uri);
    const logTitle = "Google Oauth : authorize";

    const authorizationUrl = googleClient.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
    });

    logger.log("authorization url : " + authorizationUrl, logTitle);

    res.send({ url: authorizationUrl });
});

const callback = asyncHandler(async (req, res, next) => {
    const code = req.body.code;
    const redirect_uri = req.body.redirect_uri;
    const logTitle = "Google Oauth : callback";

    if (!code || !redirect_uri) {
        throw errorUtil.generateError(authErrors.login.fields.missed);
    }

    logger.log("callback code : " + code.substring(0, 30), logTitle);
    logger.log("callback redirect_uri : " + redirect_uri, logTitle);

    const oAuth2Client = getGoogleClient(redirect_uri);
    const tokenRes = await oAuth2Client.getToken(code);

    await oAuth2Client.setCredentials(tokenRes.tokens);
    logger.log("Tokens acquired." + redirect_uri, logTitle);

    const userData = await fetchUserData(oAuth2Client.credentials.access_token);

    let user;
    user = await User.findOne({ providerId: userData.sub, provider: "google" });
    if (!user && userData.sub) {
        user = await User.create({
            provider: "google",
            providerId: userData.sub,
            email: userData.email,
            fullname: userData.name,
            image: userData.picture,
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
