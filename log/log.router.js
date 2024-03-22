const router = require("express").Router();
const logController = require("./log.controller");
const smJwt = require("../smUtils/jwt.util");

router.route("/login").get(logController.login);
router.route("/login").post(logController.loginPost);

router.use("/", async (req, res, next) => {
    let isLogged = false;
    const token = req.cookies?.token;
    if (token && typeof token === "string") {
        const newTokenData = await smJwt.verifyToken(token);
        const payload = newTokenData.payload;
        if (payload && payload.role === "superadmin") {
            isLogged = true;
        }
    }
    if (isLogged) {
        next();
    } else {
        return res.redirect(smartApiRootPath + "/log/login");
    }
});

router.route("/").get(logController.listLogFiles);
router.route("/files/:fileName").get(logController.displayLogFile);
router.route("/delete").delete(logController.deleteLogFiles);
router.route("/delete/:fileName").get(logController.deleteLogFile);

module.exports = router;
