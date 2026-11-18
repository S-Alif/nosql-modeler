# indexes

how indexes are stored, edited and checked. read this before changing the indexes section of the inspector or before changing the exporters.

## concepts

- an index is a list of **keys**, each key is a field plus a direction (1 ascending, -1 descending)
- one key is a **single field index**, more than one is a **compound index**, where the order of the keys matters (mongodb can use the first fields on their own)
- **unique** means no two documents may hold the same values for the keys
- the `_id` field is always indexed by mongodb, so it cannot be used in an index here
- a **ttl** on a date field (set in the field options, see docs/fields.md) is an index too. it is not stored in `collection.indexes`, the inspector only lists it, read only, under the indexes. the export writes it as the mongoose `expires` option

## data shape

indexes live in `collection.indexes`. keys point at fields by id, so renaming a field never breaks an index:

```js
{
    id: "idx_...",
    unique: false,
    keys: [
        { fieldId: "fld_...", direction: 1 },     // any field, any depth, not _id
        { fieldId: "fld_...", direction: -1 }
    ]
}
```

the name is not stored. mongodb builds it from the keys, `getIndexName` does the same: `email_1`, `userId_1_createdAt_-1` (nested fields use their path, `address.city_1`).

## why there is no unique or index option on a field

in mongoose, `unique: true` on a field and `index: true` on a field are shortcuts for a single field index (`unique: true` is not a validator, it only creates a unique index). they mean exactly what a single field index in this section means, so fields have no such option and nothing is stored twice. the section also covers what the shortcuts cannot: compound indexes and directions. the mongoose export writes every index as a `schema.index(...)` call, which keeps all indexes in one place and avoids the "duplicate index" warning that mongoose gives when the same index is declared on the field and on the schema. a ttl is also an index but needs a value, so it stays a field option (written as `expires`).

## rules

- an index has 1 to 32 keys, every key is an existing field of the collection, never `_id`
- a field appears only once in one index
- two indexes cannot have the same keys in the same order and directions (a change that would do this is ignored)
- an index that loses a field (the field is deleted) is shortened, an index that loses every field is removed, and a shortened index that now matches another index is removed too. this is `pruneOrphanIndexes`, run after a field delete and when a project loads
- deleting an index keeps the fields
- "+ index" adds a single field, ascending index on the first field without a single field index. it is disabled when every field has one

## warnings

shown in the index row, never blocking:

- more than one array field in the same index (mongodb cannot index parallel arrays)
- a single field index on a field that has a ttl (the ttl already is an index on that field, a second one conflicts with it)

the checks are `getIndexWarning` in lib/utils/index-summary.js.

## files

| file | purpose |
| ---- | ------- |
| lib/constants/index-options.js | directions, default direction, key limit |
| lib/models/factories.js | `createIndex`, `createIndexKey`, `Index` typedef |
| lib/models/normalize-project.js | fills in ids, unique flags and directions of saved indexes |
| lib/utils/index-operations.js | `addIndexToProject`, `updateIndexInProject`, `deleteIndexFromProject`, `getIndexableFields` (all the rules above) |
| lib/utils/index-summary.js | `getIndexName`, `getIndexWarning`, `listTtlFields` |
| lib/utils/prune-indexes.js | `pruneOrphanIndexes` |
| lib/state/modeler-reducer.js | `ADD_INDEX`, `UPDATE_INDEX`, `DELETE_INDEX` |
| components/inspector/index-list.jsx | the section: add button, rows, ttl list |
| components/inspector/index-row.jsx | one editable index: keys, directions, unique |

## actions

```js
dispatch({ type: ADD_INDEX, collectionId })
dispatch({ type: UPDATE_INDEX, collectionId, indexId, changes: { unique: true } })
dispatch({ type: UPDATE_INDEX, collectionId, indexId, changes: { keys: [{ fieldId, direction: 1 }, { fieldId: otherFieldId, direction: -1 }] } })
dispatch({ type: DELETE_INDEX, collectionId, indexId })
```

an invalid add or update returns the same state, nothing changes and nothing is saved.

## debugging

- "+ index" is disabled: every field already has a single field index, or the collection only has `_id`
- a key change does nothing: the new keys are not valid (see rules) or would duplicate another index, the select keeps showing the old value
- an index disappeared: its field was deleted, see the rules above
- a field is missing from the key select: it is `_id`, or already used by another key of the same index
