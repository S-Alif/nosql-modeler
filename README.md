# NoSQL Modeler

a free, browser based data modeler for MongoDB. design collections, fields, relationships and indexes on a visual canvas, then export Mongoose models, a mongosh setup script, JSON Schema validators, or an image. everything is saved in your browser's local storage. no server, no account.

## features

- **collections and fields**: drag collection cards on a canvas, add typed fields, nested objects and arrays, required and default values, descriptions, and an automatic `_id` field
- **field options**: enum, min and max length, min and max, pattern, trim, lowercase, uppercase, and a ttl for date fields
- **relationships**: connect two fields as a reference or an embed, drawn as plain threads with right angles that follow the cards while you drag and fade out when they do not belong to the selection
- **indexes**: single field, compound and unique indexes, with warnings for common mistakes, ttl fields are listed beside them
- **naming rules**: collection and field names follow MongoDB conventions, so exported code stays valid
- **export**: Mongoose models (plain javascript), a mongosh setup script, JSON Schema validators, project JSON, all downloadable as a zip
- **import**: load a project JSON file back in
- **image and pdf**: save the whole diagram as a png or a pdf, with grid and card shadow options
- **theme**: green palette with light, auto and dark modes
- **local first**: autosaves to your browser, nothing leaves your computer

## getting started

```bash
npm install
npm run dev
```

then open the url vite prints (usually http://localhost:5173).

other scripts: `npm run build` makes a production build, `npm run preview` serves it.

# NoSQL Modeler

[Live Demo](https://s-alif.github.io/nosql-modeler/)


## tech stack

- vite + react 19 (plain javascript, no typescript)
- @xyflow/react (react flow) for the diagram canvas
- html-to-image for the png and pdf export
- browser local storage for persistence

## project structure

```
nosql-modeler/
    index.html          html entry, mounts #root
    main.jsx            react entry
    app.jsx             layout shell (toolbar, sidebar, canvas, inspector)
    vite.config.js      vite config
    styles/             global css and design tokens
    components/         ui, grouped by feature (canvas, export, inspector, providers, sidebar, toolbar)
    lib/                non-ui code: constants, hooks, models, state, storage, utils, validators
    docs/               project docs
```

there is no src folder on purpose. `.jsx` is for components and pages, `.js` for everything else.

## docs

- [docs/conventions.md](docs/conventions.md) code style rules, follow these in every file
- [docs/state-and-storage.md](docs/state-and-storage.md) data shape, reducer, autosave and debugging
- [docs/canvas.md](docs/canvas.md) canvas, collection cards, sidebar and debugging
- [docs/fields.md](docs/fields.md) field types, nesting, the _id field, descriptions, options, ttl, inspector and debugging
- [docs/naming-rules.md](docs/naming-rules.md) collection and field naming rules and how to change them
- [docs/theme.md](docs/theme.md) colors, fonts, light and dark theme, app name and github link
- [docs/relationships.md](docs/relationships.md) reference and embed relationships, edges, rules and debugging
- [docs/indexes.md](docs/indexes.md) single field, compound and unique indexes, ttl, rules and debugging
- [docs/export-import.md](docs/export-import.md) export formats, import, png and pdf image, mapping tables and debugging

## license

MIT license with a Commons Clause restriction: free to use, change and share, but you may not sell the software or a service that is mainly the software. using it for paid work, and selling what you create with it, is fine. see [LICENSE](LICENSE) for the exact terms.

## contributing

pull requests are turned off for now. the code is open to read and the license lets you use and change your own copy, but changes are not being accepted into this project at the moment. this may change later.

## credits

the libraries below are separate works with their own licenses (all MIT): react, react-dom, @xyflow/react (react flow), html-to-image, vite.

"MongoDB" is a trademark of MongoDB, Inc. this project is not connected to or approved by MongoDB, Inc.
