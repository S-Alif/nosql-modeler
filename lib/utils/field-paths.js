/**
 * helpers for field paths like "address.city".
 * relationships point at a field by id, the ui shows it by path.
 */

/**
 * flattens the field tree into a list with the dotted path of every field.
 * @param {import("../models/factories.js").Field[]} fields field list
 * @param {string[]} [parentPath] names of the parent fields, empty for the top level
 * @returns {Array<{ id: string, path: string, field: import("../models/factories.js").Field }>}
 */
export function flattenFieldPaths(fields, parentPath = []) {
    return fields.flatMap((field) => {
        const fieldPath = [...parentPath, field.name]

        return [
            {
                id: field.id,
                path: fieldPath.join("."),
                field
            },
            ...flattenFieldPaths(field.children, fieldPath)
        ]
    })
}

/**
 * finds the dotted path of one field.
 * @param {import("../models/factories.js").Field[]} fields top level fields of the collection
 * @param {string} fieldId id of the field
 * @returns {string | null} the path, or null when the field does not exist
 */
export function getFieldPath(fields, fieldId) {
    const foundEntry = flattenFieldPaths(fields).find((entry) => entry.id === fieldId)

    return foundEntry ? foundEntry.path : null
}
