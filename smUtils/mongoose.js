const mongoose = require("mongoose");
const { getLogger } = require("./logger");
const { getEnvVar } = require("./env.util");

const connect = async (dbUrl) => {
    if (dbUrl === undefined) dbUrl = getEnvVar("DB_URL");
    const logger = getLogger();
    try {
        const conn = await mongoose.connect(dbUrl);
        logger(
            `MongoDB Connected: ${conn.connection.host}`,
            "MongoDB Connection"
        );
    } catch (error) {
        logger(error.message, "MongoDB Connection Error", "error");
        process.exit(1);
    }
};

module.exports = { connect };
