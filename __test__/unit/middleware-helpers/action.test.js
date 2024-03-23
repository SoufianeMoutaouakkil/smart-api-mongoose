// create test for create.helper.js

const {
    getAutoValue,
    setAutoFields,
    fitWithUserData,
} = require("../../../middlewares/helpers/action.helper");

const autoConfigNumber = {
    type: "number",
    length: 5,
};
const autoConfigIncrement = {
    ...autoConfigNumber,
    pattern: "increment",
};
const autoConfigIncrementPrefix = {
    ...autoConfigIncrement,
    prefix: "PREFIX",
};
const autoConfigIncrementPrefixSuffix = {
    ...autoConfigIncrementPrefix,
    suffix: "SUFFIX",
};
const autoConfigDecrement = {
    ...autoConfigNumber,
    pattern: "decrement",
};
const autoConfigDecrementPrefix = {
    ...autoConfigDecrement,
    prefix: "PREFIX",
};
const autoConfigDecrementPrefixSuffix = {
    ...autoConfigDecrementPrefix,
    suffix: "SUFFIX",
};

describe("create.helper.js => getAutoValue", () => {
    it("should return first value. '00001'.", () => {
        const dbValue = null;
        const index = 0;
        const result = getAutoValue(autoConfigIncrement, dbValue, index);
        expect(result).toBe("00001");
    });
    it("should incriment simple number", () => {
        const dbValue = 0;
        const index = 0;
        const result = getAutoValue(autoConfigIncrement, dbValue, index);
        expect(result).toBe("00001");
    });
    it("should increment with suffix", () => {
        const dbValue = "PREFIX001";
        const index = 0;
        const result = getAutoValue(autoConfigIncrementPrefix, dbValue, index);
        expect(result).toBe("PREFIX00002");
    });
    it("should increment with prefix and suffix", () => {
        const dbValue = "PREFIX001SUFFIX";
        const index = 0;
        const result = getAutoValue(
            autoConfigIncrementPrefixSuffix,
            dbValue,
            index
        );
        expect(result).toBe("PREFIX00002SUFFIX");
    });
    it("should increment with prefix and index", () => {
        const dbValue = "PREFIX001";
        const index = 1;
        const result = getAutoValue(autoConfigIncrementPrefix, dbValue, index);
        expect(result).toBe("PREFIX00003");
    });
});
