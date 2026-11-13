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
    itemType: "string",      // only used when type is "array"
    children: [              // only used by "object" and "array" of "object"
        { id: "fld_...", name: "city", type: "string", required: true, defaultValue: "", itemType: "string", children: [] }
    ]
}
```

- default values are stored as text and checked against the type by `validateDefaultValue`. exporters (batch 7) turn the text into real values
- the date default accepts `now` or any date text that `Date.parse` understands
- when a field stops being an object (or an array of objects) its children are removed by `updateFieldInTree`, the inspector asks before that happens

## field types

`string, int, long, double, decimal, boolean, date, objectId, object, array, binData, mixed`

- defaults are supported for: string, int, long, double, decimal, boolean, date
- arrays hold one item type (`itemType`), arrays of arrays are not supported
- to add a type: add it to `FIELD_TYPES` in lib/constants/field-types.js, and to `TYPES_WITH_DEFAULT_VALUE` plus a `case` in default-value-validator.js when it supports defaults

## files

| file | purpose |
| ---- | ------- |
| lib/constants/field-types.js | type names, item types, default type, types with defaults |
| lib/models/factories.js | `createField`, `Field` typedef |
| lib/utils/field-tree.js | immutable tree helpers: add, update, delete, move, find, count |
| lib/utils/format-field-type.js | `formatFieldType` gives "string" or "array<objectId>" |
| lib/validators/field-name-validator.js | `validateFieldName` |
| lib/validators/default-value-validator.js | `validateDefaultValue` |
| lib/state/modeler-reducer.js | `ADD_FIELD`, `UPDATE_FIELD`, `DELETE_FIELD`, `MOVE_FIELD` |
| components/inspector/field-inspector.jsx | inspector panel for the selected collection |
| components/inspector/field-row.jsx | one field row, draws nested rows by calling itself |
| components/inspector/validated-text-input.jsx | text input that validates while typing |
| components/canvas/collection-node.jsx | card lists top level fields and types |

## actions

```js
dispatch({ type: ADD_FIELD, collectionId, parentFieldId: null })       // null = top level
dispatch({ type: UPDATE_FIELD, collectionId, fieldId, changes: { name: "email" } })
dispatch({ type: DELETE_FIELD, collectionId, fieldId })
dispatch({ type: MOVE_FIELD, collectionId, fieldId, direction: -1 })   // -1 up, 1 down
```

new fields are named `field_1`, `field_2`... (first free number among the siblings).

## field name rules

required, no dot, cannot start with `$`, no null character, unique among the fields at the same level.

## inspector behavior

- select a collection in the sidebar or on the canvas to edit its fields
- name and default value inputs check while typing, an invalid value is shown in red and is never saved. enter or leaving the input saves, escape restores the saved value
- changing the type clears the default value, because it may not fit the new type
- the card on the canvas lists top level fields only, `*` marks required fields, more than 8 fields show "+N more"

## debugging

- field not saved: the value is invalid (red border) or the input did not lose focus yet, press enter
- nested fields missing after a type change: expected, only objects and arrays of objects keep children
- card shows old fields: the card data is built in `collectionsToNodes` (lib/utils/project-to-nodes.js)
- reorder does nothing: the first field cannot move up and the last cannot move down
