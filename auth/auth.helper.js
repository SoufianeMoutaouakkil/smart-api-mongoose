const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const verifyPassword = async function (plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

const createResetPasswordToken = async function () {
    const resetExpires = process.env.AUTH_RESET_PASSWORD_EXPIRES_MIN || 60;
    const token = crypto.randomUUID();
    const expiredAt = Date.now() + 1000 * 60 * resetExpires;
    return { token, expiredAt };
};

const cleanResetPasswordData = async function (user) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();
    return true;
};

const hashPassword = async function (pw) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(pw, salt);
};

module.exports = {
    verifyPassword,
    createResetPasswordToken,
    cleanResetPasswordData,
    hashPassword,
};
