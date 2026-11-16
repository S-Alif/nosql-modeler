# relationships

how links between fields are stored, created, edited and drawn. read this before changing relationships, edges or the relationships section of the inspector.

## concepts

collections are never linked directly, two **fields** are linked:

- the **source field** belongs to the collection that holds the link, for example `orders.userId`
- the **target field** is the field it points at, usually the `_id` of another collection, for example `users._id`
- a **reference** stores the value of the target field in the source field
- an **embed** stores the other document inside the source field (an object, or an array of objects). it has no single target field, so it ends at the target card
- one or many is not stored, it comes from the source field in the field list: an array field holds many links, anything else holds one

a relationship never creates, renames or reshapes a field. you create the fields yourself in the field list, then connect them.

## data shape

relationships live in `project.relationships`:

```js
{
    id: "rel_...",
    type: "reference",                 // "reference" or "embed"
    sourceCollectionId: "col_...",     // collection that holds the link
    sourceFieldId: "fld_...",          // field that holds the link (any depth)
    targetCollectionId: "col_...",     // collection that is pointed at
    targetFieldId: "fld_..."           // field that is pointed at, null for an embed
}
```

fields are found by id, so renaming a field never breaks a link. projects saved before field level links (no `targetFieldId`) are fixed on load: a reference gets the `_id` of its target collection as target field.

## creating a relationship

- **canvas**: hover a field row, drag from its dot to the dot of a field in another card (or another field of the same card, for things like `parentId`). nothing is created except the link
- **inspector**: select a collection, then "+ relationship" in the Relationships section. it links the first free field to the `_id` of another collection, change the source field, the target collection and the target field in the new row. the button is disabled until the collection has a field that can start a link

## which way the arrow points

the direction comes from the fields, not from the way you dragged:

- an `_id` field is what gets referenced, it can never hold a link. dragging from `users._id` to `orders.userId` gives the same result as dragging the other way: the arrow runs from `orders.userId` to `users._id`
- when neither field is an `_id`, the drag direction decides (start field is the source). if the start field already backs another relationship, the other field becomes the source
- two `_id` fields cannot be connected, and a field cannot be connected to itself
- the logic is `resolveReferenceDirection` in lib/utils/resolve-reference-direction.js

## how an edge reads

an edge is a plain thread, with no arrow head and no marks, to keep the canvas calm:

- the thread starts at the row of the source field and ends at the row of the target field (for an embed, at the target card). the colored dots on the two rows mark the ends
- **reference**: solid blue thread, **embed**: dashed amber thread, a reference whose two fields have different types is red (see warnings)
- edges that touch the selected collection are thicker
- the rows that take part in a link have a colored bar on their left edge and always show their dot, even when the card has more rows than it lists (the card lists the first 14 ordinary rows and every linked row)
- the direction (which field holds the link) is not drawn, it is shown in the inspector: the source field is in the relationship row of the collection that holds it, and the target collection lists the link under "used by"
- clicking a thread selects it: it gets thicker, its row in the inspector is highlighted, and its source collection is selected so the inspector shows it

## rules

- one field can back only one relationship (as the source), a field can be the target of any number of relationships
- the `_id` field cannot be a source field
- a reference may point at any field, `_id` by default. a reference may stay inside one collection (`categories.parentId` to `categories._id`), but never from a field to itself
- an embed cannot embed a collection into itself
- relationships are removed automatically when they can no longer be drawn: a collection is deleted, the source field is deleted, or the target field of a reference is deleted. this is done by `pruneOrphanRelationships` after field changes and when a project loads. the other field stays
- deleting a relationship keeps both fields. to delete one on the canvas, click its thread and press delete (or backspace), there is no prompt because nothing but the link is lost. the inspector row has an x button too

## warnings

field types can still be changed by hand, so a mismatch is shown, never blocked:

- a reference whose fields hold different value types: "userId holds string but _id is objectId" (array fields count by their item type). the row in the inspector shows the text and the edge turns red
- an embed whose source field is not an object or an array of objects

the check is `getRelationshipWarning` in lib/utils/relationship-rules.js.

## files

| file | purpose |
| ---- | ------- |
| lib/constants/relationship-types.js | type names |
| lib/constants/canvas-config.js | edge colors and line widths |
| lib/models/factories.js | `createRelationship`, `Relationship` typedef |
| lib/models/normalize-project.js | fills in target fields and cleans relationships when a project loads |
| lib/utils/relationship-operations.js | `addRelationshipToProject`, `updateRelationshipInProject` (all the rules above) |
| lib/utils/relationship-rules.js | value type, default target field, warnings |
| lib/utils/resolve-reference-direction.js | which field is the source when two fields are connected |
| lib/utils/prune-relationships.js | `pruneOrphanRelationships` |
| lib/utils/handle-ids.js | handle ids of field rows and card headers (`fld_abc-left`, `card:right`) |
| lib/utils/field-paths.js | `flattenFieldPaths`, `getFieldPath` (paths like `address.cityId`) |
| lib/utils/relationships-to-edges.js | `relationshipsToEdges`, `chooseHandleSides` |
| lib/utils/project-to-nodes.js | marks the fields that take part in a relationship on the cards |
| lib/state/modeler-reducer.js | `ADD_RELATIONSHIP`, `UPDATE_RELATIONSHIP`, `DELETE_RELATIONSHIP` |
| components/canvas/collection-node.jsx | the card, a pair of handles on every field row |
| components/canvas/diagram-canvas.jsx | draws edges, connects two fields on drag, edge click |
| components/inspector/relationship-list.jsx | the section: add button, rows, "used by" list |
| components/inspector/relationship-row.jsx | one editable relationship |

## actions

```js
// connect two existing fields, nothing else changes
dispatch({
    type: ADD_RELATIONSHIP,
    relationship: {
        type: "reference",                 // or "embed" (targetFieldId is ignored)
        sourceCollectionId,
        sourceFieldId,
        targetCollectionId,
        targetFieldId
    }
})
dispatch({ type: UPDATE_RELATIONSHIP, relationshipId, changes: { type: "embed" } })
dispatch({ type: UPDATE_RELATIONSHIP, relationshipId, changes: { sourceFieldId } })
dispatch({ type: UPDATE_RELATIONSHIP, relationshipId, changes: { targetCollectionId } })   // target field becomes its _id
dispatch({ type: UPDATE_RELATIONSHIP, relationshipId, changes: { targetFieldId } })
dispatch({ type: DELETE_RELATIONSHIP, relationshipId })
dispatch({ type: SELECT_RELATIONSHIP, relationshipId })      // select a thread, null clears it
```

an invalid add or update returns the same state, nothing changes and nothing is saved.

## debugging

- delete does nothing on a thread: click the thread first (it turns thicker), and make sure the focus is not in an input
- dragging does nothing: the two fields cannot be connected (see "which way the arrow points" and "rules"), react flow only lets you drop on a valid handle
- no edge is drawn: check the browser console for react flow warnings about handle ids. edges use `<fieldId>-left` and `<fieldId>-right`, which `collection-node.jsx` renders for every listed row, and `card:left` and `card:right` for embeds
- an edge sits on the wrong spot after changing fields: `collection-node.jsx` calls `updateNodeInternals` when its rows change, check that it still does
- edge attaches to the wrong side: the side comes from the card positions in `chooseHandleSides`, it updates after a drag ends
- a relationship disappeared: its source field, target field or a collection was deleted, see the rules above
- the edge is red: the two fields have different types, see the warning in the inspector row
- want an arrow head back: add `markerEnd: { type: "arrowclosed", color: edgeColor }` to the edge in `relationshipsToEdges`, it points at the target
