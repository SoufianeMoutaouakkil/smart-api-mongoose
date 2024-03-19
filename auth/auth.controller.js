const asyncHandler = require("express-async-handler");
const { throwError } = require("../smUtils/request");
const jwtUtil = require("../smUtils/jwt.util");
const path = require("path");
const {
    hashPassword,
    verifyPassword,
    createResetPasswordToken,
    cleanResetPasswordData,
} = require("./auth.helper");

const register = asyncHandler(async (req, res) => {
    const User = req.smartApi.model;
    const { username, password, role } = req.body;

    if (process.env.AUTH_REGISTER_ENABLED !== "true") {
        throwError("Registration is disabled!", "REGISTRATION_DISABLED", 403);
    }

    if (!username || !password) {
        throwError(
            "username and password are required!",
            "LOGIN_PASSWORD_REQUIRED",
            400
        );
    }

    const user = await User.findOne({ username });

    if (user) {
        throwError(
            `User with username ${username} already exists!`,
            "USER_EXISTS",
            400
        );
    }

    // check if the model will validate the user data
    let newUser = new User({});

    try {
        newUser.username = username;
        newUser.role = role;
        newUser.password = await hashPassword(password);
        await newUser.save();
    } catch (error) {
        throwError(
            `User validation failed : "${error.message}"!`,
            "USER_VALIDATION_FAILED",
            400
        );
    }

    if (newUser) {
        const user = {
            _id: newUser._id,
            username: newUser.username,
            role: newUser.role,
        };
        const token = jwtUtil.generateToken(user).token;
        const status = "SUCCESS";

        res.status(201).json({
            user,
            token,
            status,
        });
    } else {
        throwError("User creation failed!", "USER_CREATION_FAILED", 500);
    }
});

const login = asyncHandler(async (req, res) => {
    const User = req.smartApi.model;
    const { username, password } = req.body;
    if (!username || !password) {
        throwError(
            "username and password are required!",
            "LOGIN_PASSWORD_REQUIRED",
            400
        );
    }
    const user = await User.findOne({ username });

    if (!user)
        throwError(
            `User with username ${username} not found!`,
            "USER_NOT_FOUND",
            404
        );
    else if (await verifyPassword(password, user.password))
        throwError("Invalid password!", "INVALID_PASSWORD", 400);
    else
        res.json({
            user: {
                _id: user._id,
                username: user.username,
                role: user.role,
            },
            token: jwtUtil.generateToken(user).token,
            status: "SUCCESS",
        });
});

const passwordForgot = asyncHandler(async (req, res) => {
    const User = req.smartApi.model;
    const { username } = req.body;

    // check if username is email
    if (!username.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
        throwError(
            `Your user name is invalid email address: '${username}'. you can only reset password with email address!`,
            "INVALID_EMAIL_ADDRESS",
            400
        );
    const user = await User.findOne({ username });

    if (!user) {
        throwError(
            `User with username ${username} not found!`,
            "USER_NOT_FOUND",
            404
        );
    }

    let { token, expiredAt } = await createResetPasswordToken();
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpires = expiredAt;
    await user.save();
    let resetUrl = `${req.headers.origin}/reset-password/${token}`;
    console.log("resetPasswordRequest - resetUrl is :", resetUrl);
    let html = fs.read.file(
        path.resolve(__dirname, "../views/reset-password-mail.html")
    );
    html = html.replace("{resetUrl}", resetUrl);
    mailer.sendMail(
        {
            to: user.username,
            html,
        },
        async (err) => {
            await cleanResetPasswordData(user);
            throw err;
        },
        () => {
            res.json({
                message: `Password reset mail is sent to ${user.username}`,
                email: user.username,
                status: "SUCCESS",
            });
        }
    );
});

const passwordReset = asyncHandler(async (req, res) => {
    const User = req.smartApi.model;
    const { newPassword, resetPasswordToken } = req.body;

    const user = await User.findOne({ resetPasswordToken });

    if (!user) {
        throw errorUtil.generateError(
            authErrors.resetPasswordAction.token.invalid,
            { token: resetPasswordToken }
        );
    }
    if (user.resetPasswordTokenExpires < Date.now()) {
        throw errorUtil.generateError(
            authErrors.resetPasswordAction.token.expired
        );
    }

    if (!newPassword) {
        throw errorUtil.generateError(authErrors.resetPasswordAction.password);
    }
    user.password = await hashPassword(newPassword);
    await cleanResetPasswordData(user);
    res.json({
        message: "Password reseted successfully",
        status: "SUCCESS",
    });
});

module.exports = {
    register,
    login,
    passwordForgot,
    passwordReset,
};
