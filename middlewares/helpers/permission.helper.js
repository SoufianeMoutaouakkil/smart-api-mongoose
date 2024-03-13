const checkUserProps = (userFieldsCheck, user) => {
    let isAuthorized = true;
    if (!userFieldsCheck) return true;
    if (!user) return false;
    if (!Array.isArray(userFieldsCheck)) userFieldsCheck = [userFieldsCheck];

    for (let fieldCheck of userFieldsCheck) {
        let userPropValue = user[fieldCheck.field];
        let { checkOp, value, field } = fieldCheck;
        if (!checkOp && !value) checkOp = "required";
        if (value && !checkOp) checkOp = "equals";
        if (!value && checkOp !== "required") {
            throw new Error(
                `The value of the field ${field} is required for the check operation ${checkOp}`,
                "SMART_API_CONFIG_ERROR",
                409
            );
        }
        switch (checkOp) {
            case "required":
                isAuthorized = userPropValue !== undefined;
                break;
            case "equals":
                isAuthorized = userPropValue === value;
                break;
            case "different":
                isAuthorized = userPropValue !== value;
                break;
            case "contains":
                isAuthorized = userPropValue.includes(value);
                break;
            case "containedIn":
                isAuthorized = value.includes(userPropValue);
                break;
            default:
                break;
        }
        if (!isAuthorized) {
            return false;
        }
    }
    return isAuthorized;
};

module.exports = {
    checkUserProps,
};
