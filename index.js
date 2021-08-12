const os = require("os");
const fs = require("fs");
const JSZip = require("jszip");
const { normalizePath, convertDirectoryToObject } = require("./tools/converter");
const parserConfig = require("./config/initial.config");
const xmlParser = require("fast-xml-parser");
const Parser = require("fast-xml-parser").j2xParser;

class DocumentEditor {
    /**
     * @param {{ debug: boolean, workDirectory: string, documentName: string }} options
     */
    constructor(options) {
        /**
         * @type {{ showLogs: boolean, workDirectory: string, documentName: string }}
         */
        this._options = {
            showLogs: false,
            workDirectory: os.tmpdir(),
            documentName: `document_${Date.now()}`,
            ...options,
        };
    }

    /**
     * @param {Buffer} data
     * @returns {Promise<DocumentEditor | null>}
     */
    async extract(data) {
        const filesTimeLogs = [];
        const functionTime = Date.now();

        const zipContent = await JSZip.loadAsync(data, { createFolders: true });
        try {
            if (!fs.existsSync(normalizePath(this._options.workDirectory, this._options.documentName))) {
                fs.mkdirSync(normalizePath(this._options.workDirectory, this._options.documentName));

                if (this._options.showLogs) {
                    console.log("Created root directory:", normalizePath(this._options.workDirectory, this._options.documentName));
                }
            }

            for await (const key of Object.keys(zipContent.files)) {
                const t = Date.now();

                if (zipContent.files[key].dir) {
                    if (!fs.existsSync(normalizePath(this._options.workDirectory, this._options.documentName, key))) {
                        fs.mkdirSync(normalizePath(this._options.workDirectory, this._options.documentName, key));

                        if (this._options.showLogs) {
                            filesTimeLogs.push({ time: Date.now() - t + "ms", file: key });
                        }
                    }

                    continue;
                }

                await new Promise((resolve) => {
                    zipContent
                        .file(key)
                        .nodeStream()
                        .pipe(fs.createWriteStream(normalizePath(this._options.workDirectory, this._options.documentName, key)))
                        .on("finish", () => {
                            if (this._options.showLogs) {
                                filesTimeLogs.push({ time: Date.now() - t + "ms", file: key });
                            }

                            resolve(true);
                        });
                });
            }

            return this;
        } catch (exception) {
            console.error(exception);

            return null;
        } finally {
            if (this._options.showLogs) {
                console.table(filesTimeLogs);
                console.log("Exctracting time:", Date.now() - functionTime + "ms");
            }
        }
    }

    /**
     * @param {{ target: string, onParsed: (parsedDocument) => void }} onParsed
     * @returns {DocumentEditor | null}
     */
    parse(options = { target: "word/document.xml", onParsed: () => {} }) {
        if (this._options.showLogs) {
            console.time(options.target);
        }

        try {
            const docFile = fs.readFileSync(normalizePath(this._options.workDirectory, this._options.documentName, options.target), "utf-8");
            const docContent = xmlParser.parse(docFile, parserConfig.read);

            if (this._options.showLogs) {
                console.timeLog(options.target, "Parsed");
            }

            options.onParsed(docContent);

            const updatedFile = new Parser(parserConfig.write).parse(docContent);
            if (this._options.showLogs) {
                console.timeLog(options.target, "Changed");
            }

            fs.writeFileSync(normalizePath(this._options.workDirectory, this._options.documentName, options.target), updatedFile);
            return this;
        } catch (exception) {
            console.log(exception);
            return null;
        } finally {
            if (this._options.showLogs) {
                console.timeEnd(options.target);
            }
        }
    }

    /**
     * @returns {Promise<Buffer | null>}
     */
    async archive() {
        if (this._options.showLogs) {
            console.time("Buffer");
        }

        try {
            const newZip = new JSZip();
            const updatedZip = newZip.folder(this._options.documentName);
            const directoryObject = convertDirectoryToObject(normalizePath(this._options.workDirectory, this._options.documentName));

            if (this._options.showLogs) {
                console.timeLog("Buffer", "Converted directory to object");
            }

            for (const key in directoryObject) {
                updatedZip.file(key, directoryObject[key]);
            }

            return await updatedZip.generateAsync({ type: "nodebuffer" });
        } catch (exception) {
            console.log(exception);

            return null;
        } finally {
            if (this._options.showLogs) {
                console.timeEnd("Buffer");
            }
        }
    }
}

module.exports = DocumentEditor;
