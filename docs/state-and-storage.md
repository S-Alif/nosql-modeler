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
            fields: [],      // batch 4
            indexes: []      // batch 6
        }
    ],
    relationships: []        // batch 5, each one will have sourceCollectionId and targetCollectionId
}
```

app state is `{ project, selectedCollectionId }`. only `project` is saved, selection resets on reload.

## files

| file | purpose |
| ---- | ------- |
| lib/constants/action-types.js | action type names |
| lib/constants/storage-keys.js | storage keys, schema version, autosave delay |
| lib/utils/generate-id.js | `generateId("col")` unique ids |
| lib/models/factories.js | `createEmptyProject`, `createCollection`, data shape typedefs |
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

## debugging

- open devtools, application tab, local storage, key `mongo-modeler:project`
- to start over, delete that key and reload
- if a saved project cannot be read (broken json or a different `schemaVersion`), it is copied to `mongo-modeler:project-backup` and an empty project is loaded
- storage errors are logged to the console as "local storage error"
