const he = require("he");
const PARSER_CONFIG = {
    write: {
        attributeNamePrefix: "@_",
        attrNodeName: false,
        textNodeName: "#text",
        ignoreAttributes: false,
        cdataTagName: "__cdata",
        cdataPositionChar: "\\c",
        format: false,
        indentBy: "  ",
        supressEmptyNode: false,
        tagValueProcessor: (a) => he.encode(String(a), { useNamedReferences: true }),
        attrValueProcessor: (a) => he.encode(String(a), { isAttributeValue: true, useNamedReferences: true }),
    },
    read: {
        attributeNamePrefix: "@_",
        attrNodeName: false,
        textNodeName: "#text",
        ignoreAttributes: false,
        ignoreNameSpace: false,
        allowBooleanAttributes: true,
        parseNodeValue: true,
        parseAttributeValue: true,
        trimValues: false,
        cdataTagName: "__cdata",
        cdataPositionChar: "\\c",
        parseTrueNumberOnly: false,
        arrayMode: false,
        attrValueProcessor: (val) => he.decode(val, { isAttributeValue: true }),
        tagValueProcessor: (val) => he.decode(val),
    },
};

module.exports = PARSER_CONFIG;
