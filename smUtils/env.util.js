const getEnvVarOrDefault = (name, defaultValue) => {
    if (process.env[name] !== undefined) {
        return process.env[name];
    } else if (defaultValue !== undefined) {
        return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not found`);
};

const getLogEnvVar = (name) => {
    const logEnvVarsDefault = {
        LOG_TYPE: "console",
        LOG_DELAY: 3600,
    };
    return getEnvVarOrDefault(name, logEnvVarsDefault[name]);
};

const getDbEnvVar = (name) => {
    const dbEnvVarsDefault = {
        DB_URL: "mongodb://localhost:27017/test",
    };
    return getEnvVarOrDefault(name, dbEnvVarsDefault[name]);
};

const getJwtEnvVar = (name) => {
    const jwtEnvVarsDefault = {
        JWT_SECRET: "secret not found",
        JWT_EXPIRATION: "1h",
    };
    return getEnvVarOrDefault(name, jwtEnvVarsDefault[name]);
};

const getEnvVar = (name) => {
    const module = name.split("_")[0];
    switch (module) {
        case "JWT":
            return getJwtEnvVar(name);
        case "LOG":
            return getLogEnvVar(name);
        case "DB":
            return getDbEnvVar(name);
        default:
            throw new Error(
                `Environment variable that starts with ${module} is not supported`
            );
    }
};

module.exports = {
    getEnvVar,
};
