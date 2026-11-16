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
- relationship edges are rebuilt from the project with `relationshipsToEdges` (lib/utils/relationships-to-edges.js), see docs/relationships.md

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
| lib/utils/relationships-to-edges.js | `relationshipsToEdges`, `chooseHandleSides` |
| components/canvas/relationship-edge.jsx | custom edge: right angle path with rounded corners and a lane |
| lib/utils/handle-ids.js | ids of the field row and card handles |
| lib/utils/resolve-reference-direction.js | which field is the source when two fields are connected |
| lib/utils/generate-unique-name.js | `generateUniqueName("collection", names)` |
| lib/validators/collection-name-validator.js | `validateCollectionName` |

## adding a collection

clicking "+ add" puts the new card in the middle of the part of the canvas the user is looking at, however far they have panned or zoomed:

1. `useViewportCenter` reads the pane size and the react flow transform and returns the visible center in canvas coordinates
2. half of the card size is subtracted so the card is centered there (`NEW_COLLECTION_HALF_WIDTH` and `NEW_COLLECTION_HALF_HEIGHT`)
3. `findFreePosition` moves the card diagonally by `NEW_COLLECTION_CASCADE_OFFSET` while another card sits on the same spot, so clicking add twice does not stack cards
4. `ADD_COLLECTION` is dispatched with that position, and the new collection is selected

## deleting a collection or a thread

- one key handler serves both: with a thread selected, delete removes the thread, otherwise it removes the selected collection (the prompt below)

- the x button in the sidebar and the delete or backspace key on the canvas both use `confirmCollectionDelete`, so the prompt is always the same: `delete "name"?`, or `delete "name" and its N fields?` when it has fields (the automatic `_id` is not counted, nested fields are)
- the key works after clicking a card on the canvas (or the empty canvas) while a collection is selected
- it is ignored while typing in any input, and when the focus is somewhere else on the page like the sidebar or inspector, so typing and editing never delete a collection
- key repeat is ignored, holding the key does not stack prompts

## relationship edges and handles

- every field row of a card has a handle on its left and right edge (ids like `fld_abc-left`), shown when the row is hovered, always on rows that take part in a link, and on every row while a line is being dragged. the card header has two hidden handles that embed edges end at
- the connection mode is loose, so a line can start and end on any row handle, the direction of the reference is decided by the field types (see docs/relationships.md)
- dragging from a row handle to another row handle calls `handleConnect` in diagram-canvas.jsx, which resolves the direction with `resolveReferenceDirection` and dispatches `ADD_RELATIONSHIP`. no field is created. `isValidConnection` uses the same check, so only fields that can be connected accept the drop
- edges are plain threads (no arrow head, no marks) drawn by `components/canvas/relationship-edge.jsx` with right angles and rounded corners. the card side an edge uses is picked from the live card positions and widths (`diagram-canvas.jsx` builds a `cardRects` map from the react flow nodes), so threads switch sides while a card is dragged. see "how an edge reads" in docs/relationships.md
- clicking a thread selects it (`handleEdgeClick`): it gets thicker and the inspector highlights its row, its source collection is selected too. press delete or backspace to remove the thread, both fields stay and there is no prompt. clicking a card or the empty canvas deselects the thread. relationships can also be edited and deleted in the inspector
- all the relationship rules and the colors are in docs/relationships.md

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
- delete key does nothing: a collection or a thread must be selected, and the focus must not be inside an input or the sidebar/inspector
- delete removed a thread instead of the collection: a thread is selected (thick line), click the card first to select the collection
- edges missing or on the wrong side: see the debugging section of docs/relationships.md
