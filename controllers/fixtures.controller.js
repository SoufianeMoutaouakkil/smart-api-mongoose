const { getConfigFileContent } = require("../middlewares/helpers/config.helper");
const { getModel } = require("../middlewares/helpers/model.helper");

const getFixturesConfig = () => {
    return getConfigFileContent("fixtures");
};

const addFixtureInOrder = (fixturesOrder, ressource, requirements) => {
    // check if ressource has no requirements
    if (!requirements) {
        fixturesOrder.push(ressource);
        return fixturesOrder;
    }

    const fixturesConfig = getFixturesConfig();
    const fixturesRessources = Object.keys(fixturesConfig);

    // check if requirements are already in the order
    let requirementsInOrder = requirements.filter((req) =>
        fixturesOrder.includes(req)
    );

    if (requirementsInOrder.length == requirements.length) {
        // all requirements are already in the order >> add ressource
        fixturesOrder.push(ressource);
        return fixturesOrder;
    } else {
        // check if requirements are missing in the config
        let missedRequirements = requirements.filter(
            (req) => !fixturesRessources.includes(req)
        );
        if (missedRequirements.length > 0) {
            // some requirements are missing in the config >> throw error
            throw new Error(
                `Next fixtures are required for ${ressource} >> ${requirementsInConfig}`
            );
        } else {
            // add requirements in order
            requirements.forEach((req) => {
                addFixtureInOrder(
                    fixturesOrder,
                    req,
                    fixturesConfig[req]["requires"]
                );
            });
            fixturesOrder.push(ressource);
            return fixturesOrder;
        }
    }
};

const getFixturesOrder = (fixturesConfig) => {
    const fixturesRessources = Object.keys(fixturesConfig);
    let fixturesOrder = [];
    fixturesRessources.forEach((ressource) => {
        if (fixturesOrder.includes(ressource)) return;
        fixturesOrder = addFixtureInOrder(
            fixturesOrder,
            ressource,
            fixturesConfig[ressource]["requires"]
        );
    });
    return fixturesOrder;
};

const getModels = async (ressources) => {
    const models = {};
    ressources.forEach(async (ressource) => {
        console.log(`Getting model for ${ressource}`);
        models[ressource] = await getModel(ressource);
        console.log(`Model for ${ressource} is available`);
    });
    return models;
};

const getRandomItem = (arr) => {
    if (!arr || !arr.length) {
        return null; // Handle empty array gracefully
    }
    return arr[Math.floor(Math.random() * arr.length)];
};

const getRelatedRessourceField = (relatedData, data, identifier, field) => {
    console.log(
        `getting ${field} for ${identifier} = ${data} in `,
        relatedData
    );
    const relatedItem = relatedData.find((item) => item[identifier] === data);
    if (!relatedItem)
        throw new Error(`No item found for ${data} in the related ressource`);
    return relatedItem[field];
};

const getFieldValue = (fieldName, fieldConfig, index, fixtures) => {
    // fieldConfig is required
    if (!fieldConfig || typeof fieldConfig !== "object")
        throw new Error(`Invalid fieldConfig for ${fieldName}`);

    // get value and type from the fieldConfig and set the default values
    let { value, type } = fieldConfig;
    if (!type) type = "increment";

    if (!value && type !== "increment")
        throw new Error(
            `Value config is required for no increment fields. error for ${fieldName}`
        );
    else if (!value) value = {};

    if (!value.origin) value.origin = "static";
    if (!value.data) value.data = fieldName;

    if (value.origin === "static") {
        if (type === "fixed") return value.data;
        else if (type === "increment") return `${value.data}${index + 1}`;
        else if (type === "random") return getRandomItem(value.data);
        else
            throw new Error(`Invalid type for ${fieldName} for a static value`);
    } else if (value.origin === "relation") {
        // get the related model
        const relatedRessource = value.ref;
        const relatedData = fixtures[relatedRessource];
        const { identifier, field, data } = value;
        if (!relatedData)
            throw new Error(`No fixtures found for ${relatedRessource}`);
        if (type === "increment")
            throw new Error(
                `Invalid type for ${fieldName} for a relation value`
            );
        if (!identifier)
            throw new Error(`Identifier is required for ${fieldName} relation`);
        if (!field) field = "_id";

        if (type === "fixed") {
            return getRelatedRessourceField(
                relatedData,
                data,
                identifier,
                field
            );
        } else if (type === "random") {
            randomData = getRandomItem(data);
            return getRelatedRessourceField(
                relatedData,
                randomData,
                identifier,
                field
            );
        } else {
            throw new Error(
                `Invalid type for ${fieldName} for a relation value`
            );
        }
    }
    return value;
};

const handleProcess = ({ process, ressource, fixtures }) => {
    const { number, fields } = process;
    let processFixtureData = [];
    console.log(`Processing ${ressource} fixtures with number: ${number}`);
    console.log("fields: ", fields);
    for (let i = 0; i < number; i++) {
        const fixture = {};
        const fieldsNames = Object.keys(fields);
        fieldsNames.forEach((field) => {
            const value = getFieldValue(field, fields[field], i, fixtures);
            fixture[field] = value;
        });
        processFixtureData.push(fixture);
    }

    console.log(
        `getting for ${ressource} processFixtureData : `,
        processFixtureData
    );
    return processFixtureData;
};

const fixtureController = async (req, res, next) => {
    // get fixtures config
    const fixturesConfig = getFixturesConfig();
    const fixturesOrder = getFixturesOrder(fixturesConfig);
    const models = await getModels(fixturesOrder);
    let fixtures = {};
    for (let ressource of fixturesOrder) {
        const model = models[ressource];
        const processes = fixturesConfig[ressource]["processes"];
        let ressourceFixtures = [];

        console.log("processes: ", processes);
        for (let process of processes) {
            const processFixtureData = handleProcess({
                process,
                ressource,
                fixtures,
            });
            ressourceFixtures = ressourceFixtures.concat(processFixtureData);
        }
        await model.deleteMany({});
        const ressourceDbFixtures = await model.insertMany(ressourceFixtures);
        console.log(`${ressource}->ressourceDbFixtures: `, ressourceDbFixtures);
        if (!ressourceDbFixtures)
            throw new Error(`No fixtures created for ${ressource}`);
        if (ressourceDbFixtures.length !== ressourceFixtures.length)
            throw new Error(`${ressource}: invalid n of fixtures created!`);

        fixtures[ressource] = ressourceDbFixtures;
    }

    res.json({ fixturesConfig, fixturesOrder, fixtures });
};

module.exports = fixtureController;
