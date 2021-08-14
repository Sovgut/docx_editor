const os = require("os");
const fs = require("fs");
const JSZip = require("jszip");
const { normalizePath, convertDirectoryToObject } = require("./tools/converter");
const parserConfig = require("./config/initial.config");
const xmlParser = require("fast-xml-parser");
const Parser = require("fast-xml-parser").j2xParser;

class DocumentEditor {
    /**
     * Returns the name of the root directory
     * @type {string}
     */
    get documentName() {
        return this._options.documentName;
    }

    /**
     * @type {boolean}
     */
    get showLogs() {
        return this._options.showLogs;
    }

    /**
     * Returns the path to the document without document name
     * @type {string}
     */
    get workDirectory() {
        return this._options.workDirectory;
    }

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
     * Extract data to the working directory
     * @example await docEditor.extract(wordBuffer)
     * @param {Buffer} data File buffer
     *
     * @returns {Promise<DocumentEditor | null>}
     */
    async extract(data) {
        const filesTimeLogs = [];
        const functionTime = Date.now();

        const zipContent = await JSZip.loadAsync(data, { createFolders: true });
        try {
            if (!fs.existsSync(normalizePath(this.workDirectory, this.documentName))) {
                fs.mkdirSync(normalizePath(this.workDirectory, this.documentName));

                if (this.showLogs) {
                    console.log("Created root directory:", normalizePath(this.workDirectory, this.documentName));
                }
            }

            for await (const key of Object.keys(zipContent.files)) {
                const t = Date.now();

                if (zipContent.files[key].dir) {
                    if (!fs.existsSync(normalizePath(this.workDirectory, this.documentName, key))) {
                        fs.mkdirSync(normalizePath(this.workDirectory, this.documentName, key));

                        if (this.showLogs) {
                            filesTimeLogs.push({ time: Date.now() - t + "ms", file: key });
                        }
                    }

                    continue;
                }

                await new Promise((resolve) => {
                    zipContent
                        .file(key)
                        .nodeStream()
                        .pipe(fs.createWriteStream(normalizePath(this.workDirectory, this.documentName, key)))
                        .on("finish", () => {
                            if (this.showLogs) {
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
            if (this.showLogs) {
                console.table(filesTimeLogs);
                console.log("Exctracting time:", Date.now() - functionTime + "ms");
            }
        }
    }

    /**
     * @example docEditor.parse('word/document.xml', (doc) => { ... })
     * @param {string} target Relative path to the file in the extracted document
     * @param {(doc: any) => DocumentEditor | null} onParsed Callback when document parsed and ready to modifying
     *
     * @returns {DocumentEditor | null}
     */
    parse(target, onParsed) {
        if (this.showLogs) {
            console.time(target);
        }

        try {
            const docFile = fs.readFileSync(normalizePath(this.workDirectory, this.documentName, target), "utf-8");
            const docContent = xmlParser.parse(docFile, parserConfig.read);

            if (this.showLogs) {
                console.timeLog(target, "Parsed");
            }

            onParsed(docContent);

            const updatedFile = new Parser(parserConfig.write).parse(docContent);
            if (this.showLogs) {
                console.timeLog(target, "Changed");
            }

            fs.writeFileSync(normalizePath(this.workDirectory, this.documentName, target), updatedFile);
            return this;
        } catch (exception) {
            console.log(exception);
            return null;
        } finally {
            if (this.showLogs) {
                console.timeEnd(target);
            }
        }
    }

    /**
     * Archive extracted document back to the file
     * @example const dataBuffer = await docEditor.archive()
     *
     * @returns {Promise<Buffer | null>}
     */
    async archive() {
        if (this.showLogs) {
            console.time("Buffer");
        }

        try {
            const newZip = new JSZip();
            const updatedZip = newZip.folder(this.documentName);
            const directoryObject = convertDirectoryToObject(normalizePath(this.workDirectory, this.documentName));

            if (this.showLogs) {
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
            if (this.showLogs) {
                console.timeEnd("Buffer");
            }
        }
    }

    /**
     * Create the directory inside extracted document
     * @example docEditor.mkdir('word/media')
     * @param {string} relativePath Relative path to the directory in the extracted document
     *
     * @returns {DocumentEditor | null}
     */
    mkdir(relativePath) {
        try {
            if (!fs.existsSync(normalizePath(this.workDirectory, this.documentName, relativePath))) {
                fs.mkdirSync(normalizePath(this.workDirectory, this.documentName, relativePath));
            }

            return this;
        } catch (exception) {
            console.log(exception);

            return null;
        }
    }

    /**
     * Create the file inside extracted document
     * @example docEditor.writeFile('word/media/img.png', image)
     * @param {string} relativePath Relative path to the file in the extracted document
     * @param {Buffer} data File buffer
     *
     * @returns {DocumentEditor | null}
     */
    writeFile(relativePath, data) {
        try {
            fs.writeFileSync(normalizePath(this.workDirectory, this.documentName, relativePath), data);

            return this;
        } catch (exception) {
            console.log(exception);

            return null;
        }
    }
}

module.exports = DocumentEditor;
