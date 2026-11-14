# canvas and sidebar

how collections are shown and edited visually. read this before changing the canvas, the card or the sidebar.

## how it fits together

```
project.collections  --collectionsToNodes-->  react flow nodes  --> <CollectionNode />
        ^                                          |
        |                                          | drag ends
        +----------- MOVE_COLLECTION <-------------+
```

- the project in state is the source of truth
- react flow keeps its own node list (`useNodesState`) so dragging is smooth
- when collections or the selection change, the node list is rebuilt from the project (`lib/utils/project-to-nodes.js`), measured sizes are kept so cards do not flicker
- when a drag ends, the final position is saved with `MOVE_COLLECTION` (one save per drag, not one per mouse move)
- the whole app sits inside `<ReactFlowProvider>` (app.jsx), so the sidebar can read the canvas view
- react flow's own delete key is off (`deleteKeyCode={null}`), deleting is handled by the shared prompt below

## files

| file | purpose |
| ---- | ------- |
| components/canvas/diagram-canvas.jsx | react flow setup, click, drag and delete key handlers, empty hint |
| components/canvas/collection-node.jsx | the collection card with its (nested) field rows |
| components/sidebar/collection-sidebar.jsx | title, add button, list |
| components/sidebar/collection-sidebar-item.jsx | one row: select, rename, delete |
| lib/constants/canvas-config.js | node type name, zoom limits, new card size and cascade offset |
| lib/hooks/use-viewport-center.js | `useViewportCenter` gives the middle of the visible canvas |
| lib/utils/viewport-math.js | `calculateViewportCenter` (pure math, easy to test) |
| lib/utils/find-free-position.js | `findFreePosition` moves a new card aside when the spot is taken |
| lib/utils/confirm-collection-delete.js | the delete prompt used by the sidebar and the delete key |
| lib/utils/is-editable-element.js | tells if a key press happened while typing in an input |
| lib/utils/project-to-nodes.js | `collectionsToNodes`, `flattenFieldRows` |
| lib/utils/generate-unique-name.js | `generateUniqueName("collection", names)` |
| lib/validators/collection-name-validator.js | `validateCollectionName` |

## adding a collection

clicking "+ add" puts the new card in the middle of the part of the canvas the user is looking at, however far they have panned or zoomed:

1. `useViewportCenter` reads the pane size and the react flow transform and returns the visible center in canvas coordinates
2. half of the card size is subtracted so the card is centered there (`NEW_COLLECTION_HALF_WIDTH` and `NEW_COLLECTION_HALF_HEIGHT`)
3. `findFreePosition` moves the card diagonally by `NEW_COLLECTION_CASCADE_OFFSET` while another card sits on the same spot, so clicking add twice does not stack cards
4. `ADD_COLLECTION` is dispatched with that position, and the new collection is selected

## deleting a collection

- the x button in the sidebar and the delete or backspace key on the canvas both use `confirmCollectionDelete`, so the prompt is always the same: `delete "name"?`, or `delete "name" and its N fields?` when it has fields (the automatic `_id` is not counted, nested fields are)
- the key works after clicking a card on the canvas (or the empty canvas) while a collection is selected
- it is ignored while typing in any input, and when the focus is somewhere else on the page like the sidebar or inspector, so typing and editing never delete a collection
- key repeat is ignored, holding the key does not stack prompts

## sidebar behavior

- click a name: select (the card is highlighted on the canvas)
- double click a name: rename. enter saves, escape cancels, a blur saves only when the name is valid
- name rules: see docs/naming-rules.md

## how to change things

- show more inside a card: edit `collection-node.jsx` and add the needed values to the rows in `flattenFieldRows`
- add a new node type: add its name in `canvas-config.js`, create the component, register it in `nodeTypes` in `diagram-canvas.jsx`
- change card colors or sizes: `.collection-node*` classes in `styles/global.css`
- new cards land off center: adjust `NEW_COLLECTION_HALF_WIDTH` and `NEW_COLLECTION_HALF_HEIGHT` in `canvas-config.js`

## debugging

- cards invisible: react flow needs the parent to have a height, check `.app-canvas` and `.diagram-canvas` in `global.css`
- position not saved after a drag: check that `MOVE_COLLECTION` is dispatched in `handleNodeDragStop`
- a card is not selected: the `selected` flag comes from `selectedCollectionId` in `collectionsToNodes`
- new card lands far from the view: check that `<ReactFlowProvider>` wraps the app in `app.jsx`, and read the values in `useViewportCenter`
- delete key does nothing: a collection must be selected, and the focus must not be inside an input or the sidebar/inspector
