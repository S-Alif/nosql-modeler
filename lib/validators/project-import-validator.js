/**
 * validation for a project read from a file.
 * it only checks what normalizeProject cannot repair: the shape of the lists and the ids,
 * names and types that everything else depends on.
 */
import {
    ARRAY_FIELD_TYPE,
    ARRAY_ITEM_TYPES,
    FIELD_TYPES
} from "../constants/field-types.js"
import { SCHEMA_VERSION } from "../constants/storage-keys.js"

/**
 * tells whether a value is a non empty text.
 * @param {any} value value to check
 * @returns {boolean}
 */
function isNonEmptyText(value) {
    return typeof value === "string" && value.length > 0
}

/**
 * checks a list of fields and their children.
 * @param {any} fields value that should be a field list
 * @param {string} collectionName name of the collection, used in the message
 * @param {Set<string>} knownFieldIds ids seen so far in this collection, used to find duplicates
 * @returns {string | null} error message, or null when the fields are fine
 */
function validateFields(fields, collectionName, knownFieldIds) {
    if (!Array.isArray(fields)) {
        return `collection "${collectionName}" has no field list`
    }

    for (const field of fields) {
        if (typeof field !== "object" || field === null) {
            return `collection "${collectionName}" has a field that is not an object`
        }

        if (!isNonEmptyText(field.id) || !isNonEmptyText(field.name)) {
            return `collection "${collectionName}" has a field without an id or a name`
        }

        if (knownFieldIds.has(field.id)) {
            return `collection "${collectionName}" uses the field id "${field.id}" twice`
        }

        knownFieldIds.add(field.id)

        if (!FIELD_TYPES.includes(field.type)) {
            return `field "${collectionName}.${field.name}" has an unknown type "${field.type}"`
        }

        if (
            field.type === ARRAY_FIELD_TYPE &&
            field.itemType !== undefined &&
            !ARRAY_ITEM_TYPES.includes(field.itemType)
        ) {
            return `field "${collectionName}.${field.name}" has an unknown item type "${field.itemType}"`
        }

        const childError = validateFields(field.children ?? [], collectionName, knownFieldIds)

        if (childError) {
            return childError
        }
    }

    return null
}

/**
 * validates a project read from a file.
 * @param {any} project value read from the file
 * @returns {string | null} error message, or null when the project can be imported
 */
export function validateImportedProject(project) {
    if (typeof project !== "object" || project === null || Array.isArray(project)) {
        return "this file does not hold a project"
    }

    if (project.schemaVersion !== undefined && project.schemaVersion > SCHEMA_VERSION) {
        return "this project was saved by a newer version of the app"
    }

    if (!Array.isArray(project.collections)) {
        return "this file has no list of collections"
    }

    const knownCollectionIds = new Set()

    for (const collection of project.collections) {
        if (typeof collection !== "object" || collection === null) {
            return "a collection in this file is not an object"
        }

        if (!isNonEmptyText(collection.id) || !isNonEmptyText(collection.name)) {
            return "a collection in this file has no id or no name"
        }

        if (knownCollectionIds.has(collection.id)) {
            return `the collection id "${collection.id}" is used twice`
        }

        knownCollectionIds.add(collection.id)

        const fieldError = validateFields(collection.fields ?? [], collection.name, new Set())

        if (fieldError) {
            return fieldError
        }
    }

    if (project.relationships !== undefined && !Array.isArray(project.relationships)) {
        return "the relationships in this file are not a list"
    }

    return null
}
