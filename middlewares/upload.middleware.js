const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (fs.existsSync("uploads") === false) {
            fs.mkdirSync("uploads");
        }
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        console.log("file", file);
        cb(null, Date.now() + "_" + file.originalname);
    },
});

module.exports = multer({ storage: storage });
