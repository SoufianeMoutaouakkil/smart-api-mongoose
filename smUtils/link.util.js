const linkConsole = (message, data) => {
    console.log("#".repeat(20) + " LINKTEST" + "#".repeat(20));
    console.log({ message, data });
};

module.exports = {
    linkConsole,
};
