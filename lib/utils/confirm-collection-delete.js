/**
 * confirmation prompt used by every way of deleting a collection
 * (the sidebar button and the delete key on the canvas).
 */
import { countFieldsInTree } from "./field-tree.js"

/**
 * asks the user to confirm deleting a collection.
 * the automatic _id field is not counted, the user did not add it.
 * @param {import("../models/factories.js").Collection} collection collection about to be deleted
 * @returns {boolean} true when the user confirmed
 */
export function confirmCollectionDelete(collection) {
    const systemFieldCount = collection.fields.filter((field) => field.isSystem).length
    const userFieldCount = countFieldsInTree(collection.fields) - systemFieldCount

    if (userFieldCount === 0) {
        return window.confirm(`delete "${collection.name}"?`)
    }

    const fieldWord = userFieldCount === 1 ? "field" : "fields"

    return window.confirm(`delete "${collection.name}" and its ${userFieldCount} ${fieldWord}?`)
}
