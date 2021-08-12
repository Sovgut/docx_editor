# Docx Raw Editor

```javascript
const path = require("path");
const fs = require("fs");
const DocumentEditor = require("docx_editor");

(async () => {
    const data = fs.readFileSync(path.join(process.cwd(), "document.docx"));
    const docEditor = await new DocumentEditor().extract(data);
    const updatedDocument = await docEditor
        .parse((doc) => {
            doc["w:document"]["w:body"]["w:p"][0]["w:r"] = [{ "w:t": "Hello World!" }];
        })
        .archive();

    fs.writeFileSync(path.join(process.cwd(), "document-edited.docx"), updatedDocument);
})()
```
