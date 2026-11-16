# state and storage

how modeler data is held in memory and saved in the browser. read this before adding a new action or changing the saved shape.

## data shape

```js
// project (saved to local storage)
{
    schemaVersion: 1,
    collections: [
        {
            id: "col_...",
            name: "users",
            position: { x: 80, y: 80 },
            fields: [...],   // always starts with the automatic _id field, see docs/fields.md
            indexes: []      // batch 6
        }
    ],
    relationships: []        // links between collections, see docs/relationships.md
}
```

app state is `{ project, selectedCollectionId, selectedRelationshipId }`. only `project` is saved, selection resets on reload. selecting a thread (`SELECT_RELATIONSHIP`) also selects its source collection, and `SELECT_COLLECTION` clears the thread selection. the selected relationship id can outlive its relationship (a field delete removes it), so look it up before using it.

## files

| file | purpose |
| ---- | ------- |
| lib/constants/action-types.js | action type names |
| lib/constants/storage-keys.js | storage keys, schema version, autosave delay |
| lib/utils/generate-id.js | `generateId("col")` unique ids |
| lib/models/factories.js | `createEmptyProject`, `createCollection`, `createField`, `createIdField`, data shape typedefs |
| lib/models/normalize-project.js | `normalizeProject` brings a loaded project up to the current shape |
| lib/storage/local-storage.js | `loadProject`, `saveProject` (errors never throw) |
| lib/state/modeler-reducer.js | reducer and `createInitialState` |
| lib/state/modeler-context.js | the react context object |
| components/providers/modeler-provider.jsx | runs the reducer, autosaves |
| lib/hooks/use-modeler.js | `const { state, dispatch } = useModeler()` |

## how to add a new action

1. add the type name to lib/constants/action-types.js (and its export block)
2. add a `case` in lib/state/modeler-reducer.js, return a new object, never mutate state
3. dispatch it from a component: `dispatch({ type: ADD_COLLECTION })`

## how saving works

- every change to `state.project` starts a 400 ms timer, a new change restarts it, then the project is written to local storage
- the project is also saved on `beforeunload`
- selection changes do not trigger a save

## loading old projects

`loadProject` runs `normalizeProject` on every project it reads. it adds anything a newer version expects (the `_id` field, field descriptions, field options, relationship target fields) so saved projects keep working without a `schemaVersion` bump. when you add a new property to a collection or field, fill in its default in lib/models/normalize-project.js. bump `SCHEMA_VERSION` only for changes normalizing cannot fix, because an unknown version is backed up and replaced by an empty project.

## debugging

- open devtools, application tab, local storage, key `mongo-modeler:project`
- to start over, delete that key and reload
- if a saved project cannot be read (broken json or a different `schemaVersion`), it is copied to `mongo-modeler:project-backup` and an empty project is loaded
- storage errors are logged to the console as "local storage error"
