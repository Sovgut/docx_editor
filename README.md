# Docx Raw Editor
```javascript
const path = require("path");
const fs = require("fs");
const DocumentEditor = require("docx_editor");

(async () => {
    const data = fs.readFileSync(path.join(process.cwd(), "document.docx"));
    const docEditor = await new DocumentEditor().extract(data);
    const updatedDocument = await docEditor
        .parse({
            target: 'word/document.xml',
            onParsed: (doc) => {
                doc["w:document"]["w:body"]["w:p"][0]["w:r"] = [{ "w:t": "Hello World!" }];
            }
        })
        .archive();

    fs.writeFileSync(path.join(process.cwd(), "document-edited.docx"), updatedDocument);
})()
```

# Edit multiple files
```javascript
const path = require("path");
const fs = require("fs");
const DocumentEditor = require("docx_editor");

(async () => {
    const data = fs.readFileSync(path.join(process.cwd(), "document.docx"));
    const docEditor = await new DocumentEditor().extract(data);
    
    docEditor.parse({
        target: "docProps/app.xml",
        onParsed: (doc) => {
            doc["Properties"]["Lines"] = 2;
        },
    });
    
    docEditor.parse({
        target: "word/document.xml",
        onParsed: (doc) => {
            doc["w:document"]["w:body"]["w:p"][0]["w:r"] = [{ "w:t": "Hello World!" }];
        },
    });
    
    const updatedDocument = await docEditor.archive();
    fs.writeFileSync(path.join(process.cwd(), "document-edited.docx"), updatedDocument);
})()
```