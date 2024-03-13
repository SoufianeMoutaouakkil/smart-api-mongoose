const path = require("path");
const { getTrackedExports } = require(
    path.join(appRoot, "utils", "tools", "tracker")
);

/**
 * returns an array of fields that are present in the object and are also present in the allowedFields array
 * @param {Object} object
 * @param {Array} allowedFields
 * @returns {Array}
 */
const getExistingAllowedFields = (object, allowedFields) => {
    const objectFields = Object.keys(object);
    return allowedFields.filter((field) => objectFields.includes(field));
};

/**
 * returns an array of objects with only the fields present in the fields array
 * it can also be used to filter an object
 *
 * @example of array of objects:
 * const objects = [{name: "John", age: 25}, {name: "Jane", age: 30}];
 * const fields = ["name"];
 * const filteredObjects = filter(objects, fields);
 * @example of object:
 * const object = {name: "John", age: 25};
 * const fields = ["name"];
 * const filteredObject = filter(object, fields);
 *
 * @param {Array|Object} objects
 * @param {Array} fields
 * @returns {Array}
 */
const filter = (objects, fields) => {
    const isArray = Array.isArray(objects);
    if (!isArray) objects = [objects];
    const filteredObjects = objects.map((object) => {
        const newObject = {};
        fields.forEach((field) => {
            if (object[field]) newObject[field] = object[field];
        });
        return newObject;
    });
    return isArray ? filteredObjects : filteredObjects[0];
};

module.exports = getTrackedExports({ getExistingAllowedFields, filter });
