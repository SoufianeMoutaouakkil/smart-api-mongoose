const asyncHandler = require("express-async-handler");
const { throwError } = require("../../smUtils/request");
const jwtUtil = require("../../smUtils/jwt.util");
const path = require("path");

const User = require("../../models/users.model");

const register = asyncHandler(async (req, res) => {
    const { fullname, login, password, image, role } = req.body;

    if (process.env.AUTH_REGISTER_ENABLED !== "true") {
        throwError("Registration is disabled!", "REGISTRATION_DISABLED", 403);
    }

    if (!login || !password) {
        throwError(
            "Login and password are required!",
            "LOGIN_PASSWORD_REQUIRED",
            400
        );
    }

    let email = null;
    // ceck if login is email with regex
    if (login.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) email = login;

    const user = await User.findOne({ login });

    if (user) {
        throwError(
            `User with login ${login} already exists!`,
            "USER_EXISTS",
            400
        );
    }

    // check if the model will validate the user data
    let newUser = new User({});

    try {
        newUser.fullname = fullname;
        newUser.login = login;
        newUser.email = email;
        newUser.image = image;
        newUser.role = role;
        await newUser.save();
    } catch (error) {
        throwError(
            `User validation failed : "${error.message}"!`,
            "USER_VALIDATION_FAILED",
            400
        );
    }

    await newUser.setPassword(password);
    await newUser.save();
    if (newUser) {
        const user = {
            _id: newUser._id,
            login: newUser.login,
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
    const { login, password } = req.body;

    const user = await User.findOne({ login });

    if (!user)
        throwError(
            `User with login ${login} not found!`,
            "USER_NOT_FOUND",
            404
        );
    else if (!user.verifyPassword(password))
        throwError("Invalid password!", "INVALID_PASSWORD", 400);
    else
        res.json({
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
            },
            token: jwtUtil.generateToken(user).token,
            status: "SUCCESS",
        });
});

const resetPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throwError(
            `User with email ${email} not found!`,
            "USER_NOT_FOUND",
            404
        );
    }

    let token = await user.createResetPasswordToken();
    let resetUrl = `${req.headers.origin}/reset-password/${token}`;
    console.log("resetPasswordRequest - resetUrl is :", resetUrl);
    let html = fs.read.file(
        path.resolve(__dirname, "../views/reset-password-mail.html")
    );
    html = html.replace("{resetUrl}", resetUrl);
    mailer.sendMail(
        {
            to: user.email,
            html,
        },
        (err) => {
            user.cleanResetPasswordData();
            throw err;
        },
        () => {
            res.json({
                message: `Password reset mail is sent to ${user.email}`,
                email: user.email,
                status: "SUCCESS",
            });
        }
    );
});

const resetPasswordAction = asyncHandler(async (req, res) => {
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
    await user.setPassword(newPassword);
    await user.cleanResetPasswordData();
    res.json({
        message: "Password reseted successfully",
        status: "SUCCESS",
    });
});

module.exports = {
    register,
    login,
    resetPasswordRequest,
    resetPasswordAction,
};
