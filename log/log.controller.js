const path = require("path");
const smJwt = require("../smUtils/jwt.util");
const logPath = require("../smUtils/logger/fileLogger").getLogPath();

const getLogDir = () => {
    return logPath;
};

const listLogFiles = (req, res) => {
    const fs = require("fs");
    const logDir = getLogDir();
    let files = [];
    if (fs.existsSync(logDir)) {
        files = fs.readdirSync(logDir);
        files = files.map((file) => {
            // remove the extension
            let fileWithoutExt = file.split(".").slice(0, -1).join(".");
            return fileWithoutExt;
        });
    }

    return res.status(200).render("log/list", {
        smartApiRootPath,
        title: "Log Files",
        files,
    });
};

const displayLogFile = (req, res) => {
    const fs = require("fs");
    const logDir = getLogDir();
    const fileName = req.params.fileName;
    let content = "";
    const filePath = path.join(logDir, `${fileName}.log`);
    console.log("displayLogFile : filePath : ", filePath);
    if (fs.existsSync(filePath)) {
        console.log("displayLogFile : file exists");
        content = fs.readFileSync(filePath, "utf8");
    }

    return res.status(200).render("log/file", {
        smartApiRootPath,
        title: "Log File",
        fileName,
        content,
    });
};

const login = (req, res) => {
    // checking if user is already logged in with coockie token
    const token = req.cookies.token;
    if (token && typeof token === "string") {
        const payload = smJwt.verifyToken(token);
        if (payload && payload.logged) {
            return res.redirect(smartApiRootPath + "/log");
        }
    }

    return res.status(200).render("log/login", {
        smartApiRootPath,
        title: "Login",
    });
};

const loginPost = (req, res) => {
    const password = req.body.password;

    console.log("user password", password);
    console.log("env password", process.env.LOG_PASSWORD);

    if (password === process.env.LOG_PASSWORD) {
        console.log("Logged in");
        // set cookie with a token
        const token = smJwt.generateToken({ role: "superadmin" });
        console.log("login token : ", token);
        res.cookie("token", token.token, { maxAge: 1000 * 60 * 60, httpOnly: true });
        return res.redirect(smartApiRootPath + "/log");
    } else {
        console.log("Invalid password");
        return res.status(401).render("log/login", {
            smartApiRootPath,

            title: "Login",
            message: "Invalid password",
        });
    }
};

const deleteLogFiles = (req, res) => {
    const password = req.body.password;
    if (password !== process.env.LOG_PASSWORD) {
        return res.status(401).json({
            title: "Login",
            message: "Invalid password",
            code: "INVALID_PASSWORD",
        });
    }

    console.log("Deleting all log files");

    const fs = require("fs");
    const logDir = getLogDir();
    let files = [];
    if (fs.existsSync(logDir)) {
        files = fs.readdirSync(logDir);
        files.forEach((file) => {
            fs.unlinkSync(path.join(logDir, file));
            console.log(`Deleted file ${file}`);
        });
    }
    res.json({ message: "Deleted all log files", success: true });
};

const deleteLogFile = (req, res) => {
    const fs = require("fs");
    const logDir = getLogDir();
    const fileName = req.params.fileName;
    const filePath = path.join(logDir, `${fileName}.log`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file ${fileName}`);
    }
    res.redirect(smartApiRootPath + "/log");
};

module.exports = {
    listLogFiles,
    displayLogFile,
    login,
    loginPost,
    deleteLogFiles,
    deleteLogFile,
};
