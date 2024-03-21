const router = require("express").Router();
const authController = require("./auth.controller");
const modelMiddleware = require("../middlewares/model.middleware");

router.use((req, res, next) => {
    const smartApi = { params: { ressourceName: "users" } };
    req.smartApi = smartApi;
    next();
}, modelMiddleware);

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/forgot-password", authController.passwordForgot);
router.post("/reset-password", authController.passwordReset);

module.exports = router;
