const express = require("express");
const app = express();
require("dotenv").config();
require("dotenv").config({ path: ".env.local" });

const mongoose = require("./smUtils/mongoose");
mongoose.connect();

const authMiddleware = require("./middlewares/auth.middleware");
const reqMiddleware = require("./middlewares/req.middleware");
const modelMiddleware = require("./middlewares/model.middleware");
const configMiddleware = require("./middlewares/config.middleware");
const userCheckMiddleware = require("./middlewares/userCheck.middleware");
const uploadMiddleware = require("./middlewares/upload.middleware");
const fileMiddleware = require("./middlewares/file.middleware");
const importMiddleware = require("./middlewares/import.middleware");
const fetchMiddleware = require("./middlewares/fetch.middleware");
// const ressourceCheckMiddleware = require("./middlewares/ressourceCheck.middleware");
const createMiddleware = require("./middlewares/create.middleware");
const updateMiddleware = require("./middlewares/update.middleware");
const removeMiddleware = require("./middlewares/remove.middleware");
const fieldsFilterMiddleware = require("./middlewares/fieldsFilter.middleware");
const removeModelsMiddleware = require("./middlewares/removeModels.middleware");
const exportMiddleware = require("./middlewares/export.middleware");
const resMiddleware = require("./middlewares/res.middleware");

const errorMiddleware = require("./middlewares/error.middleware");

const logrouter = require("./log/log.router");
const fixtureMiddleware = require("./middlewares/fixture.middleware");
const authrouter = require("./auth/auth.router");

app.use(express.json());
// allow all origins
const cors = require("cors");
app.use(cors());

app.use(express.urlencoded({ extended: true }));

const viewsDir = __dirname + "/views";
app.set("view engine", "ejs");
app.set("views", viewsDir);
const coockieParser = require("cookie-parser");
app.use(coockieParser());

app.use("*", (req, res, next) => {
    console.log("smart api package : req.originalUrl", req.originalUrl);
    next();
});

app.use(smartApiRootPath + "/log", logrouter);

app.use(smartApiRootPath + "/fixtures", fixtureMiddleware);

app.use(smartApiRootPath + "/auth", authrouter);

app.use(
    smartApiRootPath + "/api",
    authMiddleware,
    reqMiddleware,
    modelMiddleware,
    configMiddleware,
    userCheckMiddleware,
    uploadMiddleware.any(),
    fileMiddleware,
    importMiddleware,
    fetchMiddleware,
    // ressourceCheckMiddleware,
    createMiddleware,
    updateMiddleware,
    removeMiddleware,
    fieldsFilterMiddleware,
    removeModelsMiddleware,
    exportMiddleware,
    resMiddleware
);

app.use(errorMiddleware);

module.exports = app;
