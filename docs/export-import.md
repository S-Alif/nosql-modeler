# export and import

how the project leaves the app (code, validators, json, image) and how it comes back in. read this before changing an exporter or the toolbar buttons.

## what the toolbar offers

- **Export** opens a dialog: pick a format, read the generated files, copy one, download one, or download all of them as a zip
- **Import** reads a project json file and replaces the current diagram after a confirmation
- **Share** makes a link that holds the whole diagram, see [sharing.md](sharing.md)
- **Image / PDF** opens a dialog that saves the whole diagram as a png image or a pdf

## formats

| format | files | notes |
| ------ | ----- | ----- |
| Mongoose models | `models/<collection>.js` per collection and `models/index.js` | plain javascript, es modules, written in this project's code style (4 spaces, double quotes, no semicolons). every file starts with `import { Schema, model, models } from "mongoose"`, no `mongoose.` prefix and no destructuring |
| MongoDB setup script | `setup.js` | mongosh script: `db.createCollection` with the validator, then every `createIndex` and every ttl |
| JSON Schema validators | `validators/<collection>.json` per collection | `{ "$jsonSchema": ... }`, paste it into the validation tab of Compass or Atlas |
| Project JSON | `nosql-modeler-project.json` | the whole diagram, imports back in |

file names are the kebab-case of the collection name (`user_profiles` becomes `user-profiles.js`), model names are PascalCase (`UserProfiles`). the model keeps the real collection name as its third argument, so mongoose never renames the collection.

## mongoose mapping

| in the modeler | in the model |
| -------------- | ------------ |
| string, boolean, date, binData | `String`, `Boolean`, `Date`, `Buffer` |
| int, long | `Number` plus a `validate` that checks `Number.isInteger` (mongoose has no integer type) |
| double | `Number` |
| decimal | `Schema.Types.Decimal128` |
| objectId, mixed | `Schema.Types.ObjectId`, `Schema.Types.Mixed` |
| required, default | `required: true`, `default` (a date default of "now" is `Date.now`) |
| enum, minLength, maxLength, trim, lowercase, uppercase, min, max | the same names. numbers stay numbers, the min and max of dates become `new Date(...)` |
| match | `match: new RegExp("...")` |
| ttl | `expires: <seconds>` |
| object | a nested object. a **required** object is a sub schema (`type: new Schema({...}, { _id: false })`) because mongoose cannot require a plain nested object |
| array of objects | `[{ _id: false, ... }]`, sub documents without an id of their own |
| array of other types | `[String]`, the field options apply to the items |
| reference to the `_id` of a collection | `ref: "TargetModel"` |
| reference to another field | a comment above the field (mongoose `ref` only works on `_id`) |
| embed | the schema of the embedded collection, imported from its file |
| indexes | `schema.index({ ... }, { unique: true })`. single field, compound and unique indexes are all written this way, never as `index: true` or `unique: true` on the field, see docs/indexes.md |
| the automatic `_id` (objectId) | left out, mongoose adds it |
| the model | `models.Users \|\| model("Users", usersSchema, "users")`, safe against hot reload, the third argument keeps the real collection name |

things mongoose cannot express stay visible as a comment above the field: enum, min and max on decimal fields (Decimal128 has no such options, only the validator checks them), and two collections that embed each other (the field becomes `Schema.Types.Mixed`, because two files cannot import each other's schema).

two options in the dialog, both off to match the usual setup: `timestamps` and the version key (`versionKey: false` is written while it is off).

## validator mapping

bsonType follows the field type (`bool` for boolean, no bsonType for mixed). required fields (never `_id`) go in `required`. enum, minLength, maxLength, `pattern` (from match), `minimum` and `maximum` are written when set. a field description becomes `description`. an embed puts the schema of the embedded collection inside the field.

left out because `$jsonSchema` has no rule for them: trim, lowercase, uppercase, and the min and max of dates.

## project json

```js
{
    app: "nosql-modeler",
    fileVersion: 1,
    project: { schemaVersion: 1, collections: [...], relationships: [...] }
}
```

an import accepts this wrapper or a bare project. it is checked by `validateImportedProject` (lib/validators/project-import-validator.js): the file must be json, hold a `collections` list, every collection and field needs an id and a name, ids must be unique, field types must be known, and the project must not come from a newer version. then `normalizeProject` fills in everything missing (the `_id` field, options, descriptions, index ids ...) and drops links and indexes that no longer match a field, exactly like loading a saved project. collections without a position are spread out. a problem is shown in an alert and nothing changes. a good file replaces the project after a confirm and the view jumps to fit it.

## image and pdf

the **Image / PDF** button opens a dialog:

| option | what it does |
| ------ | ------------ |
| format | PNG image, or PDF |
| grid dots in the background | draws the same dot grid the canvas shows, lined up with the canvas coordinates. off gives a plain background |
| shadow under the collection cards | off removes the soft shadow under the cards (a class on the canvas, `export-no-shadow`, set only while drawing) |
| paper (pdf only) | A4, A3, Letter, or "same size as the diagram". a paper size turns landscape when the diagram is wider than tall, scales the diagram to fit inside a 24 pt margin and centers it |

all options start on. the file uses the current theme and its background color (the pdf page is filled with it too), so pick **Light** in the toolbar first when you want a print on white. when you save, the selection is cleared first so no card or thread is drawn highlighted.

how it works (`exportCanvasImage` in lib/utils/export-canvas-image.js):

1. `html-to-image` draws the cards and threads (the react flow viewport element, moved so all cards start 90 px from the corner) to a transparent canvas
2. a second canvas gets the background color, the grid dots if asked for, and the drawn diagram on top
3. png: the canvas is saved as a png. pdf: the pixels are packed (deflate, lossless) into a one page pdf made by lib/utils/create-pdf.js, no pdf library involved

resolution: png is drawn at 2 pixels per css pixel, pdf at 3, so the pdf stays sharp when printed. both are lowered automatically for very large diagrams (a canvas is limited to about 36 million pixels). a diagram wider or taller than 6000 px is refused with a message, move the collections closer together. the picture in the pdf is an image, not live text and shapes, so text cannot be selected. `html-to-image` is the only added dependency.

## files

| file | purpose |
| ---- | ------- |
| lib/constants/export-formats.js | format ids and labels, mongoose option defaults, project file name and version |
| lib/utils/build-export-files.js | `buildExportFiles(formatId, project, options)`, the one function the dialog calls |
| lib/utils/export-mongoose.js | mongoose models, `doesEmbedReach` |
| lib/utils/export-validators.js | `buildCollectionValidator`, validator files, mongosh setup script |
| lib/utils/code-writer.js | prints values as code in the project style (`raw`, `call`, `codeObject`, `printValue`) |
| lib/utils/field-values.js | default values and enum values as real values |
| lib/utils/name-formats.js | PascalCase, kebab-case and schema variable names |
| lib/utils/project-json.js | `buildProjectJsonText`, `parseProjectJson` |
| lib/validators/project-import-validator.js | `validateImportedProject` |
| lib/utils/create-zip.js | zip writer (stored, no compression), `createZip` |
| lib/utils/download-file.js | `downloadBlob`, `downloadTextFile`, `copyTextToClipboard` |
| lib/constants/image-export.js | formats, paper sizes, option defaults, resolution and grid settings |
| lib/utils/export-canvas-image.js | `exportCanvasImage`, grid drawing, pixel ratio |
| lib/utils/create-pdf.js | `createImagePdf`, `getPaperLayout`, `deflateBytes` |
| components/export/export-dialog.jsx | the dialog |
| components/export/image-export-dialog.jsx | the image and pdf dialog |
| components/toolbar/app-toolbar.jsx | the Import, Image / PDF and Export buttons |

## how to add a format

1. add its id and label to lib/constants/export-formats.js (and the export block)
2. write `buildXFiles(project)` returning `[{ name, content }]`
3. add a `case` in lib/utils/build-export-files.js

the dialog picks it up on its own.

## debugging

- the image or pdf cannot be saved: the dialog shows the reason, check the console ("image export error"), make sure `npm install` ran so `html-to-image` exists, and that the diagram is not larger than 6000 px
- the image is missing threads or cards: only what react flow has drawn can be captured, wait for the diagram to finish rendering
- shadows still show with the option off: `.export-no-shadow .collection-node` in global.css must match the card class
- the grid does not match the canvas: spacing is `GRID_GAP` and the dot size `GRID_DOT_SIZE` in lib/constants/image-export.js
- the pdf looks soft when printed: raise `PDF_PIXEL_RATIO` (the pixel limit still applies)
- an import is refused: the alert names the problem, fix the file or export it again from the app
- a generated model has an odd field: look for a comment above the field, notes are written there
- the generated code does not match your style: the style is produced by lib/utils/code-writer.js
