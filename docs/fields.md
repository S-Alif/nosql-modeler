# fields

how fields are stored, edited and shown. read this before changing field types, the inspector or the field rules.

## data shape

a field lives in `collection.fields`. object fields (and arrays of objects) hold their own list in `children`, so fields nest as deep as needed.

```js
{
    id: "fld_...",
    name: "address",
    type: "object",          // one of FIELD_TYPES
    required: false,
    defaultValue: "",        // typed text, "" means no default
    description: "",         // optional note, shown as a tooltip on the canvas card
    isSystem: false,         // true only for the automatic _id field
    itemType: "string",      // only used when type is "array"
    options: { ... },        // enum, limits, pattern, ttl, see "field options" below
    children: [              // only used by "object" and "array" of "object"
        { id: "fld_...", name: "city", type: "string", required: true, defaultValue: "", description: "", isSystem: false, itemType: "string", options: { ... }, children: [] }
    ]
}
```

- default values are stored as text and checked against the type by `validateDefaultValue`. exporters turn the text into real values
- the date default accepts `now` or any date text that `Date.parse` understands
- when a field stops being an object (or an array of objects) its children are removed by `updateFieldInTree`, the inspector asks before that happens

## the _id field

every collection starts with an `_id` field (`createIdField` in lib/models/factories.js). it is a system field (`isSystem: true`):

- always first in the list, always required
- the name cannot be changed, it cannot be deleted, and it cannot be moved (nothing can swap places with it either)
- its type can change (default `objectId`), but not to `array`, mongodb does not allow that
- it can have a description
- these rules are enforced in `lib/utils/field-tree.js` (so the reducer cannot break them) and the inspector hides or disables the matching controls
- a nested field named `_id` inside an object is an ordinary field

projects saved before this existed are fixed on load by `normalizeProject` (lib/models/normalize-project.js): a missing `_id` is added at the front, an existing top level `_id` is kept, locked and moved first, and missing descriptions and options are filled in.

## field options

every field has an `options` object with the mongoose style rules and the ttl setting. the "options" button on a field row opens a panel with the options that fit the field, the button shows how many are set, for example `options (2)`. an array uses the options of its item type and applies them to each item. changing the type keeps the options while they still fit (int to long, double to decimal, string to array of strings) and resets them otherwise.

```js
options: {
    enumValues: [],      // allowed values, empty means any value
    minLength: "",       // text fields
    maxLength: "",       // text fields
    min: "",             // number fields: lowest value, date fields: earliest date
    max: "",             // number fields: highest value, date fields: latest date
    match: "",           // text fields: regular expression, for example "^[a-z0-9_-]+$"
    trim: false,         // text fields
    lowercase: false,    // text fields, excludes uppercase
    uppercase: false,    // text fields, excludes lowercase
    ttlValue: "",        // date fields: time to live as typed text, "" means no ttl
    ttlUnit: "days"      // seconds, minutes, hours or days
}
```

all values are stored as the text the user typed (like default values) and checked by lib/validators/field-options-validator.js, exporters turn them into real values.

| field type | options |
| ---------- | ------- |
| string | enum, min length, max length, pattern, trim, lowercase, uppercase |
| int, long, double, decimal | enum, min, max |
| date | min, max, ttl |
| boolean, objectId, object, binData, mixed, _id | none |

what the options mean in mongoose (what the export writes): `enum`, `minLength`, `maxLength`, `match`, `trim`, `lowercase`, `uppercase`, `min`, `max`. numbers in an enum are real numbers in the export, and the dates of min and max become dates.

### ttl (time to live)

a date field can have a ttl: mongodb deletes the document a set time after the date stored in that field. set it in the options panel of a date field ("ttl, delete the document after", a number and a unit). the export turns it into seconds (`getTtlSeconds`) and writes mongoose's `expires` option, which creates the ttl index (`expireAfterSeconds`).

- a typical use is a `createdAt` or `expiresAt` date, for example sessions that disappear after 7 days
- the value is a whole number, 0 or more, up to about 68 years. 0 deletes the document as soon as the date has passed
- mongodb checks about once a minute, so deletion is not exact, and documents whose field is missing or not a date never expire
- the indexes section of the inspector lists ttl fields next to the other indexes (read only), they are created from here, not typed twice. see docs/indexes.md

### option warnings

a default value that breaks the options of its own field (not in the enum, shorter than the min length, below the min, before the min date, not matching the pattern ...) shows a warning under the field row. it is only a warning, the field still saves. an invalid option value (a negative length, a broken regular expression, min bigger than max) is shown in red in its input and not saved.

## field types

`string, int, long, double, decimal, boolean, date, objectId, object, array, binData, mixed`

- defaults are supported for: string, int, long, double, decimal, boolean, date
- arrays hold one item type (`itemType`), arrays of arrays are not supported
- to add a type: add it to `FIELD_TYPES` in lib/constants/field-types.js, and to `TYPES_WITH_DEFAULT_VALUE` plus a `case` in default-value-validator.js when it supports defaults

## files

| file | purpose |
| ---- | ------- |
| lib/constants/field-types.js | type names, item types, `_id` name and types, locked properties |
| lib/constants/naming-rules.js | name patterns and length limits (see docs/naming-rules.md) |
| lib/models/factories.js | `createField`, `createIdField`, `Field` typedef |
| lib/models/normalize-project.js | fixes projects saved by older versions on load |
| lib/constants/field-options.js | option categories, which options each category has, ttl units and limit |
| lib/utils/field-options.js | which options fit a field, how many are set, `getOptionsAfterTypeChange`, `getTtlSeconds` |
| lib/validators/field-options-validator.js | `validateOption`, `validateEnumValue`, `getDefaultValueConflict` |
| lib/utils/field-tree.js | immutable tree helpers: add, update, delete, move, find, count |
| lib/utils/format-field-type.js | `formatFieldType` gives "string" or "array<objectId>" |
| lib/validators/field-name-validator.js | `validateFieldName` |
| lib/validators/name-characters-validator.js | character check shared with collection names |
| lib/validators/default-value-validator.js | `validateDefaultValue` |
| lib/state/modeler-reducer.js | `ADD_FIELD`, `UPDATE_FIELD`, `DELETE_FIELD`, `MOVE_FIELD` |
| components/inspector/field-inspector.jsx | inspector panel for the selected collection |
| components/inspector/field-row.jsx | one field row, draws nested rows by calling itself |
| components/inspector/field-options-panel.jsx | the options panel of a field (enum, limits, pattern, ttl) |
| components/inspector/enum-values-editor.jsx | enum chips and the input that adds values |
| components/inspector/validated-text-input.jsx | text input that validates while typing |
| components/canvas/collection-node.jsx | card that lists all fields, nested ones indented |

## actions

```js
dispatch({ type: ADD_FIELD, collectionId, parentFieldId: null })       // null = top level
dispatch({ type: UPDATE_FIELD, collectionId, fieldId, changes: { name: "email" } })
dispatch({ type: DELETE_FIELD, collectionId, fieldId })
dispatch({ type: MOVE_FIELD, collectionId, fieldId, direction: -1 })   // -1 up, 1 down
```

new fields are named `field_1`, `field_2`... (first free number among the siblings).

## field name rules

letters, numbers and underscores only, must start with a letter or underscore, unique among the fields at the same level, max 64 characters. the full list and how to change it is in docs/naming-rules.md.

## inspector behavior

- select a collection in the sidebar or on the canvas to edit its fields
- name, default value and description inputs check while typing, an invalid value is shown in red and is never saved. enter or leaving the input saves, escape restores the saved value
- changing the type clears the default value, because it may not fit the new type (options are kept while they still fit)
- every field has an optional description line
- a field that backs a relationship shows a small note like `reference → users._id` (see docs/relationships.md)
- the `_id` row shows its name as fixed text with an "auto" badge, a locked required checkbox and no delete button

## canvas card

- the card lists every field, nested fields are indented under their parent (14px per level)
- `*` marks required fields (not shown for `_id`), hovering a row shows its description
- more than 50 rows show "+N more" (`MAX_VISIBLE_ROWS` in collection-node.jsx)
- the rows are built by `flattenFieldRows` in lib/utils/project-to-nodes.js

## debugging

- field not saved: the value is invalid (red border) or the input did not lose focus yet, press enter
- nested fields missing after a type change: expected, only objects and arrays of objects keep children
- card shows old fields: the card data is built in `collectionsToNodes` (lib/utils/project-to-nodes.js)
- reorder does nothing: the first field cannot move up and the last cannot move down, and nothing can move above `_id`
- `_id` missing in an old project: it is added when the project loads, check that `normalizeProject` runs in `loadProject`
- no "options" button on a field: objects, booleans, objectIds, binData, mixed and `_id` have no options
- options disappeared after a type change: they only stay while the new type is in the same group, see `getOptionsAfterTypeChange`
- a field loses its options after loading an old project: `normalizeFieldOptions` fills in missing options and resets a broken enum list
