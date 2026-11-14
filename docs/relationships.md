# relationships

how links between collections are stored, created, edited and drawn. read this before changing relationships, edges or the relationships section of the inspector.

## concepts

- a **reference** stores the `_id` of a document of another collection in a field (for example `orders.userId` holds a `users._id`)
- an **embed** stores the other document inside a field (an object, or an array of objects)
- the **source** collection owns the field, the **target** collection is the one that is referenced or embedded
- **cardinality** (one or many) is not stored, it comes from the source field: an array field means many, anything else means one

## data shape

relationships live in `project.relationships`:

```js
{
    id: "rel_...",
    type: "reference",                 // "reference" or "embed"
    sourceCollectionId: "col_...",     // collection that owns the field
    sourceFieldId: "fld_...",          // field that holds the reference or the embedded document (any depth)
    targetCollectionId: "col_..."      // collection that is referenced or embedded
}
```

a reference always points at the target's `_id`. the field is found by id, so renaming it never breaks the link.

## how the relationship and its field stay in step

creating a relationship also creates its field, so the model is always consistent:

- the field is added at the end of the source collection, named after the target: `userId` for a reference to `users`, `order_item_id` for `order_items` (snake_case targets get snake_case names), `user` for an embed
- the field type fits: the target's `_id` type (usually `objectId`) for a reference, `object` for an embed
- changing the **type**, **target** or **cardinality** of the relationship reshapes the field: one is the plain type, many is an array of it
- a field that still has its automatic name is renamed to follow the new type or target. a name the user chose is never changed
- picking a **different existing field** as the source moves the link without changing that field, a warning shows when its type does not fit
- turning an embed into a reference removes the nested fields of the embedded field, the inspector asks first
- the plural to singular guess is simple (`categories` to `category`, `addresses` to `address`), rename the field when it is wrong

## rules

- one field can back only one relationship
- the `_id` field cannot be a source field
- a collection cannot link to itself (self links are not supported yet)
- the target of a reference is always `_id`
- relationships are removed automatically when they can no longer be drawn: the source or target collection is deleted, the source field is deleted, or the source field disappears because its parent stopped being an object. this is done by `pruneOrphanRelationships` after field changes, and also when a project loads
- deleting a relationship keeps its field, delete the field too if you do not need it

## creating and editing

- **inspector**: select a collection, then "+ relationship" in the Relationships section. it adds a reference to the first other collection, change the type, target, field or cardinality in the new row
- **canvas**: hover a card, drag from one of its dots to another card. this adds a reference from the dragged card to the card you drop on
- **inspector row**: type select (reference or embed), target collection, source field (with its path and type), one or many, and a delete button
- the "used by" list under the rows shows relationships from other collections that point at the selected one, click one to jump to its collection
- a field that backs a relationship shows a small note like `reference → users` in the field list, and `→ users` after its type on the canvas card

## warnings

the field type can still be changed by hand, so the row shows a warning instead of blocking the change:

- a reference whose field does not match the target `_id` type: "a reference to users should be objectId or array<objectId>"
- an embed whose field is not an object or an array of objects

the check is `getRelationshipWarning` in lib/utils/relationship-rules.js.

## how edges are drawn

- every relationship is one edge from the source card to the target card (`relationshipsToEdges`)
- **reference**: solid blue line, **embed**: dashed amber line, both end in an arrow (colors are in lib/constants/canvas-config.js)
- the label shows the field path and the cardinality: `userId (ref 1)`, `tagIds (ref N)`, `address (embed 1)`
- edges that touch the selected collection are thicker
- each card has a source and a target handle on all four sides (8 handles, ids like `left-source` and `top-target`). the edge builder picks the sides that face each other from the card positions (`chooseHandleSides`), so edges leave from the right, left, top or bottom. the handles are hidden until you hover a card
- clicking an edge selects its source collection, so the relationship shows in the inspector

## files

| file | purpose |
| ---- | ------- |
| lib/constants/relationship-types.js | type names and cardinalities |
| lib/constants/canvas-config.js | edge colors, line widths, arrow type |
| lib/models/factories.js | `createRelationship`, `Relationship` typedef |
| lib/models/normalize-project.js | cleans relationships when a project loads |
| lib/utils/relationship-operations.js | `addRelationshipToProject`, `updateRelationshipInProject` (all the rules above) |
| lib/utils/relationship-rules.js | cardinality, field shape, target id type, warnings |
| lib/utils/relationship-naming.js | `singularizeName`, `buildRelationshipFieldName` |
| lib/utils/prune-relationships.js | `pruneOrphanRelationships` |
| lib/utils/field-paths.js | `flattenFieldPaths`, `getFieldPath` (paths like `address.cityId`) |
| lib/utils/relationships-to-edges.js | `relationshipsToEdges`, `chooseHandleSides` |
| lib/utils/project-to-nodes.js | marks relationship fields on the cards |
| lib/state/modeler-reducer.js | `ADD_RELATIONSHIP`, `UPDATE_RELATIONSHIP`, `DELETE_RELATIONSHIP` |
| components/canvas/collection-node.jsx | the card and its handles |
| components/canvas/diagram-canvas.jsx | draws edges, handles drag to connect and edge click |
| components/inspector/relationship-list.jsx | the section: add button, rows, "used by" list |
| components/inspector/relationship-row.jsx | one editable relationship |

## actions

```js
dispatch({ type: ADD_RELATIONSHIP, sourceCollectionId, targetCollectionId })               // reference
dispatch({ type: ADD_RELATIONSHIP, sourceCollectionId, targetCollectionId, relationshipType: "embed" })
dispatch({ type: UPDATE_RELATIONSHIP, relationshipId, changes: { type: "embed" } })
dispatch({ type: UPDATE_RELATIONSHIP, relationshipId, changes: { targetCollectionId } })
dispatch({ type: UPDATE_RELATIONSHIP, relationshipId, changes: { sourceFieldId } })
dispatch({ type: UPDATE_RELATIONSHIP, relationshipId, changes: { cardinality: "many" } })  // reshapes the field
dispatch({ type: DELETE_RELATIONSHIP, relationshipId })
```

an invalid add or update returns the same state, nothing changes and nothing is saved.

## debugging

- no edge is drawn: check the browser console for react flow warnings about handle ids, edges use `<side>-source` and `<side>-target`, which `collection-node.jsx` must render for all four sides
- edge attaches to the wrong side: the side comes from the card positions in `chooseHandleSides`, it updates after a drag ends
- a relationship disappeared: its source field or a collection was deleted, see the rules above
- dragging between cards does nothing: self links are rejected in `isValidConnection` in diagram-canvas.jsx
- field type changed by itself: that is the relationship reshaping its field, see "how the relationship and its field stay in step"
- an edge label is wrong: it is built in `relationshipsToEdges` from the field path and `getFieldCardinality`
