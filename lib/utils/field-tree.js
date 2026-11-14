/**
 * helpers for the field tree of a collection.
 * a collection holds a list of fields, and an "object" field (or an array of
 * objects) holds its own list in `children`. every helper here is immutable,
 * it returns a new list and never changes the one it receives.
 */
import {
    ARRAY_FIELD_TYPE,
    LOCKED_SYSTEM_FIELD_PROPERTIES,
    OBJECT_FIELD_TYPE
} from "../constants/field-types.js"

/**
 * tells whether a field can hold nested fields.
 * @param {import("../models/factories.js").Field} field field to check
 * @returns {boolean} true for object fields and arrays of objects
 */
export function hasChildFields(field) {
    return (
        field.type === OBJECT_FIELD_TYPE ||
        (field.type === ARRAY_FIELD_TYPE && field.itemType === OBJECT_FIELD_TYPE)
    )
}

/**
 * finds a field anywhere in the tree.
 * @param {import("../models/factories.js").Field[]} fields field list to search
 * @param {string} fieldId id of the field
 * @returns {import("../models/factories.js").Field | null} the field, or null when missing
 */
export function findFieldById(fields, fieldId) {
    for (const field of fields) {
        if (field.id === fieldId) {
            return field
        }

        const foundChildField = findFieldById(field.children, fieldId)

        if (foundChildField) {
            return foundChildField
        }
    }

    return null
}

/**
 * returns the list a new field would be added to.
 * @param {import("../models/factories.js").Field[]} fields top level fields of the collection
 * @param {string | null} parentFieldId id of the parent field, null for the top level
 * @returns {import("../models/factories.js").Field[]} sibling fields
 */
export function getSiblingFields(fields, parentFieldId) {
    if (parentFieldId === null) {
        return fields
    }

    const parentField = findFieldById(fields, parentFieldId)

    return parentField ? parentField.children : []
}

/**
 * counts all fields in the tree, nested ones included.
 * @param {import("../models/factories.js").Field[]} fields field list
 * @returns {number} total number of fields
 */
export function countFieldsInTree(fields) {
    return fields.reduce(
        (totalCount, field) => totalCount + 1 + countFieldsInTree(field.children),
        0
    )
}

/**
 * adds a field at the top level, or at the end of a parent field's children.
 * @param {import("../models/factories.js").Field[]} fields current field list
 * @param {string | null} parentFieldId id of the parent field, null for the top level
 * @param {import("../models/factories.js").Field} newField field to add
 * @returns {import("../models/factories.js").Field[]} new field list
 */
export function addFieldToTree(fields, parentFieldId, newField) {
    if (parentFieldId === null) {
        return [...fields, newField]
    }

    return fields.map((field) => {
        if (field.id === parentFieldId) {
            return {
                ...field,
                children: [...field.children, newField]
            }
        }

        return {
            ...field,
            children: addFieldToTree(field.children, parentFieldId, newField)
        }
    })
}

/**
 * removes the changes that are never allowed.
 * the id and the isSystem flag of any field can never change, and the name
 * and required flag of a system field (the _id field) are locked.
 * @param {import("../models/factories.js").Field} field field that is about to change
 * @param {Partial<import("../models/factories.js").Field>} changes requested changes
 * @returns {Partial<import("../models/factories.js").Field>} the changes that are allowed
 */
function filterAllowedChanges(field, changes) {
    const blockedProperties = field.isSystem
        ? ["id", "isSystem", ...LOCKED_SYSTEM_FIELD_PROPERTIES]
        : ["id", "isSystem"]

    return Object.fromEntries(
        Object.entries(changes).filter(([propertyName]) => !blockedProperties.includes(propertyName))
    )
}

/**
 * applies changes to one field. when the new type cannot hold nested fields,
 * its children are cleared so no hidden fields are left behind.
 * @param {import("../models/factories.js").Field[]} fields current field list
 * @param {string} fieldId id of the field to change
 * @param {Partial<import("../models/factories.js").Field>} changes properties to overwrite
 * @returns {import("../models/factories.js").Field[]} new field list
 */
export function updateFieldInTree(fields, fieldId, changes) {
    return fields.map((field) => {
        if (field.id === fieldId) {
            const changedField = {
                ...field,
                ...filterAllowedChanges(field, changes)
            }

            if (!hasChildFields(changedField) && changedField.children.length > 0) {
                return {
                    ...changedField,
                    children: []
                }
            }

            return changedField
        }

        return {
            ...field,
            children: updateFieldInTree(field.children, fieldId, changes)
        }
    })
}

/**
 * removes a field and everything nested inside it. a system field (the _id field) is never removed.
 * @param {import("../models/factories.js").Field[]} fields current field list
 * @param {string} fieldId id of the field to remove
 * @returns {import("../models/factories.js").Field[]} new field list
 */
export function deleteFieldFromTree(fields, fieldId) {
    return fields
        .filter((field) => field.id !== fieldId || field.isSystem)
        .map((field) => ({
            ...field,
            children: deleteFieldFromTree(field.children, fieldId)
        }))
}

/**
 * moves a field one place up or down among its siblings.
 * @param {import("../models/factories.js").Field[]} fields current field list
 * @param {string} fieldId id of the field to move
 * @param {-1 | 1} direction -1 moves up, 1 moves down
 * @returns {import("../models/factories.js").Field[]} new field list
 */
export function moveFieldInTree(fields, fieldId, direction) {
    const fieldIndex = fields.findIndex((field) => field.id === fieldId)

    if (fieldIndex !== -1) {
        const targetIndex = fieldIndex + direction

        if (targetIndex < 0 || targetIndex >= fields.length) {
            return fields
        }

        // the system _id field stays first, nothing swaps places with it
        if (fields[fieldIndex].isSystem || fields[targetIndex].isSystem) {
            return fields
        }

        const reorderedFields = [...fields]
        const movedField = reorderedFields[fieldIndex]
        reorderedFields[fieldIndex] = reorderedFields[targetIndex]
        reorderedFields[targetIndex] = movedField

        return reorderedFields
    }

    return fields.map((field) => ({
        ...field,
        children: moveFieldInTree(field.children, fieldId, direction)
    }))
}
