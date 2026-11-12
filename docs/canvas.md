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
- keyboard delete is off on the canvas (`deleteKeyCode={null}`), collections are deleted from the sidebar

## files

| file | purpose |
| ---- | ------- |
| components/canvas/diagram-canvas.jsx | react flow setup, click and drag handlers, empty hint |
| components/canvas/collection-node.jsx | the collection card (name and field count for now) |
| components/sidebar/collection-sidebar.jsx | title, add button, list |
| components/sidebar/collection-sidebar-item.jsx | one row: select, rename, delete |
| lib/constants/canvas-config.js | node type name, zoom limits |
| lib/utils/project-to-nodes.js | `collectionsToNodes` |
| lib/utils/generate-unique-name.js | `generateUniqueName("collection", names)` |
| lib/validators/collection-name-validator.js | `validateCollectionName` |

## sidebar behavior

- click a name: select (the card is highlighted on the canvas)
- double click a name: rename. enter saves, escape cancels, a blur saves only when the name is valid
- x button: delete, asks for confirmation only when the collection has fields
- name rules: required, max 120 characters, no `$`, no null character, cannot start with `system.`, must be unique

## how to change things

- show more inside a card: edit `collection-node.jsx` and add the needed values to `data` in `project-to-nodes.js`
- add a new node type: add its name in `canvas-config.js`, create the component, register it in `nodeTypes` in `diagram-canvas.jsx`
- change card colors or sizes: `.collection-node*` classes in `styles/global.css`

## debugging

- cards invisible: react flow needs the parent to have a height, check `.app-canvas` and `.diagram-canvas` in `global.css`
- position not saved after a drag: check that `MOVE_COLLECTION` is dispatched in `handleNodeDragStop`
- a card is not selected: the `selected` flag comes from `selectedCollectionId` in `collectionsToNodes`
