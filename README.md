# Docx Editor
Tool for editing .docx files as plain js objects

# Code examples

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

# Options
You can pass options to constructor for changing working directory, default document name or for enabling logging

```typescript
{
    // Default: false
    showLogs: boolean
    
    // Default: os.tmpdir()
    workDirectory: string
    
    // Default: `document_${Date.now()}`
    documentName: string
}
```

# Installation
```bash
$ npm i docx_editor
```