#!/usr/bin/env node

const fs = require("fs");
const generatePostmanCollection = require("./postman");

const args = process.argv.slice(2);
let name = "My API";
let ressources = ["users"];

args.forEach((arg, index) => {
    if (arg === "--name") {
        name = args[index + 1];
    } else if (arg === "--ressources") {
        ressources = args[index + 1].split(",");
    }
});

const data = {
    name: name || "My API",
    ressources: ressources.length > 0 ? ressources : ["users"],
};

const collection = generatePostmanCollection(data);

const collectionString = JSON.stringify(collection, null, 2);

fs.writeFileSync("collection.json", collectionString);

console.log("Collection generated successfully");
