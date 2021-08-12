const fs = require("fs");
const path = require("path");

/**
 * @param  {...string} paths
 * @returns {string}
 */
function normalizePath(...paths) {
    return path.normalize(path.join(...paths));
}

/**
 * @param {string} directory
 * @param {string} rootKey
 *
 * @returns {{ [key: string]: Buffer }}
 */
function convertDirectoryToObject(directory, rootKey = String()) {
    /**
     * @type {{ [key: string]: Buffer }}
     */
    let object = {};

    for (const file of fs.readdirSync(directory, { withFileTypes: true })) {
        const key = rootKey ? `${rootKey}/${file.name}` : file.name;

        if (fs.lstatSync(normalizePath(directory, file.name)).isDirectory()) {
            object = { ...object, ...convertDirectoryToObject(normalizePath(directory, file.name), key) };
        } else {
            object[key] = fs.readFileSync(normalizePath(directory, file.name));
        }
    }

    return object;
}

module.exports = { normalizePath, convertDirectoryToObject };
