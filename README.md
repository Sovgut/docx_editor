# Docx Editor
Tool for editing .docx files as plain js objects

# Code examples

```javascript
const path = require("path");
const fs = require("fs");
const DocumentEditor = require("docx_editor");

(async () => {
    const data = fs.readFileSync(path.join(process.cwd(), "document.docx"));
    const img = fs.readFileSync(path.join(process.cwd(), "example.png"));
    const docEditor = await new DocumentEditor().extract(data);
    
    docEditor.parse("docProps/app.xml", (doc) => {
        doc["Properties"]["Lines"] = 2;
    });
    
    docEditor.parse("word/document.xml", (doc) => {
        doc["w:document"]["w:body"]["w:p"][0]["w:r"] = [{ "w:t": "Hello World!" }];
    });
    
    docEditor.mkdir("word/media");
    docEditor.writeFile("word/media/img.png", img);
    
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
    
    // Default: `document_${nanoid(8)}_${Date.now()}`
    documentName: string
}
```

# Installation
```bash
$ npm i docx_editor
```