const e = require("express");
const asyncHandler = require("express-async-handler");
const path = require("path");

const { fs } = require(path.join(appRoot, "utils", "tools"));
const { errorUtil } = require(path.join(appRoot, "utils", "tools"));
const { authErrors } = require(path.join(appRoot, "config", "errorCodes"));
const User = require(path.join(appRoot, "models", "usersModel"));
const Company = require(path.join(appRoot, "models", "companiesModel"));
const jwt = require(path.join(appRoot, "utils", "jwt"));
const mailer = require(path.join(appRoot, "config", "mailer"));
const logger = require(path.join(appRoot, "utils", "tools")).logger.log();

const register = asyncHandler(async (req, res) => {
    const { fullname, email, password, image, role } = req.body;

    if (!process.env.AUTH_REGISTER_ENABLED) {
        throw errorUtil.generateError(authErrors.register.disabled);
    }

    if (!email || !password) {
        throw errorUtil.generateError(authErrors.register.fields.missed);
    }

    const user = await User.findOne({ email });

    if (user) {
        throw errorUtil.generateError(authErrors.register.user.exists);
    }

    const newUser = await new User({
        fullname,
        email,
        password,
        image,
        role,
    });
    await newUser.setPassword(password);
    await newUser.save();
    if (newUser) {
        res.status(201).json({
            user: {
                _id: newUser._id,
                fullname: newUser.fullname,
                email: newUser.email,
                roles: newUser.roles,
                image: newUser.image,
            },
            token: jwt.generateToken(newUser).token,
            status: "SUCCESS",
        });
    } else {
        throw errorUtil.generateError(authErrors.register.user.create);
    }
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.verifyPassword(password))) {
        res.json({
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                image: user.image,
                companyId: user.companyId,
            },
            token: jwt.generateToken(user).token,
            status: "SUCCESS",
        });
    } else {
        throw errorUtil.generateError(authErrors.login.credentials);
    }
});

const resetPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        console.log("Error code in ath : ", res.statusCode);
        throw errorUtil.generateError(authErrors.resetPasswordRequest.email, {
            email,
        });
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

const registerTransEmail = asyncHandler(async (req, res) => {
    const { email, fullname, role, phone, password } = req.body;
    if (!process.env.AUTH_REGISTER_ENABLED) {
        throw errorUtil.generateError(authErrors.register.disabled);
    }
    if (!email || !password || !fullname || !role) {
        throw errorUtil.generateError(authErrors.register.fields.missed);
    }
    let user;
    let company;
    user = await User.findOne({ email });
    if (user) {
        throw errorUtil.generateError(authErrors.register.user.exists);
    }
    user = await new User({
        fullname,
        email,
        role,
        phone,
    });
    await user.setPassword(password);
    await user.save();
    if (!user) {
        throw errorUtil.generateError(authErrors.register.user.create);
    } else if (user.role === "transporter") {
        company = await new Company({
            name: "Ese : " + user.fullname,
        });
        company.createdBy = user._id;
        await company.save();
        if (company) {
            user.companyId = company._id;
            await user.save();
        } else {
            throw errorUtil.generateError(authErrors.register.company.create);
        }
    }
    res.json({
        user,
        company: company ? company : null,
        token: jwt.generateToken(user).token,
        status: "SUCCESS",
    });
});

const registerTransProvider = asyncHandler(async (req, res) => {
    const logTitle = "registerTransProvider";
    const { provider, providerId, fullname, role, phone } = req.body;

    if (!provider || !providerId || !role || !fullname || !phone) {
        throw errorUtil.generateError(authErrors.register.fields.missed);
    }

    const user = await User.findOne({ provider, providerId });
    if (!user) {
        throw errorUtil.generateError(authErrors.register.user.notExists);
    }
    if (user.isCompleted) {
        throw errorUtil.generateError(authErrors.register.user.completed);
    }

    user.fullname = fullname;
    user.role = role;
    user.phone = phone;
    user.isCompleted = true;
    await user.save();
    logger.log("User is : " + JSON.stringify(user), logTitle);

    let company;
    if (user.role === "transporter") {
        company = await new Company({
            name: "Ese : " + user.fullname,
        });
        company.createdBy = user._id;
        await company.save();
        if (company) {
            logger.log("Company is : ", company);
            user.companyId = company._id;
            await user.save();
        } else {
            throw errorUtil.generateError(authErrors.register.company.create);
        }
    }
    res.json({
        user,
        company: company ? company : null,
        token: jwt.generateToken(user).token,
        status: "SUCCESS",
    });
});

module.exports = {
    register,
    registerTransProvider,
    registerTransEmail,
    login,
    resetPasswordRequest,
    resetPasswordAction,
};
