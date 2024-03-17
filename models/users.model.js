const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const ROLES = process.env.ROLES ?? "user,admin";
const rolesList = ROLES.split(",");

const usersEntity = mongoose.Schema(
    {
        fullname: {
            type: "String",
            trim: true,
            maxlength: [50, "max characters is 20!"],
            minlength: [2, "min characters is 2!"],
        },
        email: {
            type: "String",
            unique: true,
            validate: {
                validator: function (value) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                },
                message: "Invalid email address format",
            },
        },
        login: {
            type: "String",
            unique: true,
            required: [true, "Login is required!"],
            minlength: [2, "min characters is 2!"],
        },
        password: {
            type: "String",
            minlength: [2, "min characters is 2!"],
        },
        image: {
            type: "String",
            default:
                "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
        },
        role: {
            type: "String",
            enum: [...rolesList],
            default: rolesList?.[0],
        },
        resetPasswordToken: {
            type: "String",
        },
        provider: {
            type: "String",
        },
        providerId: {
            type: "String",
        },
        resetPasswordTokenExpires: {
            type: "Date",
        },
    },
    { timestaps: true }
);

usersEntity.methods.verifyPassword = async function (pw) {
    return await bcrypt.compare(pw, this.password);
};

usersEntity.methods.createResetPasswordToken = async function () {
    const token = crypto.randomUUID();
    this.resetPasswordToken = token;
    this.resetPasswordTokenExpires = Date.now() + 1000 * 60 * 60;
    await this.save();
    console.log(token, this.resetPasswordToken);

    return token;
};

usersEntity.methods.cleanResetPasswordData = async function () {
    this.resetPasswordToken = undefined;
    this.resetPasswordTokenExpires = undefined;
    await this.save();
    return true;
};

usersEntity.methods.setPassword = async function (pw) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(pw, salt);
};

usersEntity.methods.setRoles = async function (roles) {
    if (Array.isArray(roles) && roles.length > 0) {
        this.roles = [...new Set(roles)];
    } else if (!Array.isArray(roles)) {
        this.roles = roles;
    }
};

module.exports = mongoose.model("users", usersEntity);
