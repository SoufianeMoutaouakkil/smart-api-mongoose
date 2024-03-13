const express = require("express");
const app = express();

const authMiddleware = require("./middlewares/auth.middleware");
const configMiddleware = require("./middlewares/config.middleware");
const reqMiddleware = require("./middlewares/req.middleware");
const resMiddleware = require("./middlewares/res.middleware");
const userCheckMiddleware = require("./middlewares/userCheck.middleware");
const fetchMiddleware = require("./middlewares/fetch.middleware");
const errorMiddleware = require("./middlewares/error.middleware");
const uploadMiddleware = require("./middlewares/upload.middleware");
const fileMiddleware = require("./middlewares/file.middleware");
const modelMiddleware = require("./middlewares/model.middleware");
const actionMiddleware = require("./middlewares/update.middleware");
const createMiddleware = require("./middlewares/create.middleware");
const updateMiddleware = require("./middlewares/update.middleware");
const removeMiddleware = require("./middlewares/remove.middleware");
// const ressourceCheckMiddleware = require("./middlewares/ressourceCheck.middleware");
const fixtureMiddleware = require("./middlewares/fixture.middleware");
const exportMiddleware = require("./middlewares/export.middleware");
const importMiddleware = require("./middlewares/import.middleware");
const fieldsFilterMiddleware = require("./middlewares/fieldsFilter.middleware");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/fixtures", fixtureMiddleware);

app.use(
    "/",
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
    exportMiddleware,
    resMiddleware,
    errorMiddleware
);

module.exports = app;
