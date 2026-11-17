/**
 * add, update and delete rules for collection indexes.
 * every function takes a project and returns a new project, or the same project object
 * when the change is not allowed, so the reducer can tell that nothing changed.
 *
 * rules:
 *  - an index has 1 to 32 keys, every key points at an existing field of the collection
 *  - the _id field cannot be indexed, mongodb already indexes it
 *  - a field appears only once in one index
 *  - two indexes cannot have the same keys in the same order and directions
 */
import {
    INDEX_DIRECTIONS,
    MAX_INDEX_KEYS
} from "../constants/index-options.js"
import {
    createIndex,
    createIndexKey
} from "../models/factories.js"
import { findFieldById } from "./field-tree.js"
import { flattenFieldPaths } from "./field-paths.js"

/**
 * lists the fields of a collection that can be indexed (every field except _id).
 * @param {import("../models/factories.js").Collection} collection collection to read
 * @returns {Array<{ id: string, path: string, field: import("../models/factories.js").Field }>}
 */
export function getIndexableFields(collection) {
    return flattenFieldPaths(collection.fields).filter((entry) => !entry.field.isSystem)
}

/**
 * tells whether a key list can be used for an index of this collection.
 * @param {import("../models/factories.js").Collection} collection collection that owns the index
 * @param {import("../models/factories.js").IndexKey[]} keys keys to check
 * @returns {boolean}
 */
export function areIndexKeysValid(collection, keys) {
    if (!Array.isArray(keys) || keys.length === 0 || keys.length > MAX_INDEX_KEYS) {
        return false
    }

    const knownDirections = INDEX_DIRECTIONS.map((direction) => direction.value)
    const usedFieldIds = new Set()

    return keys.every((key) => {
        const field = findFieldById(collection.fields, key.fieldId)
        const isNewField = !usedFieldIds.has(key.fieldId)

        usedFieldIds.add(key.fieldId)

        return Boolean(field) && !field.isSystem && isNewField && knownDirections.includes(key.direction)
    })
}

/**
 * tells whether two key lists are the same index: same fields, same order, same directions.
 * @param {import("../models/factories.js").IndexKey[]} firstKeys first key list
 * @param {import("../models/factories.js").IndexKey[]} secondKeys second key list
 * @returns {boolean}
 */
export function haveSameKeys(firstKeys, secondKeys) {
    return (
        firstKeys.length === secondKeys.length &&
        firstKeys.every(
            (key, position) =>
                key.fieldId === secondKeys[position].fieldId &&
                key.direction === secondKeys[position].direction
        )
    )
}

/**
 * returns a new project where one collection is replaced by the result of an updater.
 * @param {import("../models/factories.js").Project} project current project
 * @param {string} collectionId id of the collection to change
 * @param {Function} applyChange receives the collection, returns the changed collection
 * @returns {import("../models/factories.js").Project}
 */
function updateCollectionById(project, collectionId, applyChange) {
    return {
        ...project,
        collections: project.collections.map((collection) =>
            collection.id === collectionId ? applyChange(collection) : collection
        )
    }
}

/**
 * adds a single field ascending index on the first field that has no single field index yet.
 * the keys and the unique setting can be changed afterwards.
 * @param {import("../models/factories.js").Project} project current project
 * @param {string} collectionId id of the collection that gets the index
 * @returns {import("../models/factories.js").Project} same project when no field is free
 */
export function addIndexToProject(project, collectionId) {
    const collection = project.collections.find((candidate) => candidate.id === collectionId)

    if (!collection) {
        return project
    }

    const singleIndexedFieldIds = new Set(
        collection.indexes.filter((index) => index.keys.length === 1).map((index) => index.keys[0].fieldId)
    )
    const freeField = getIndexableFields(collection).find((entry) => !singleIndexedFieldIds.has(entry.id))

    if (!freeField) {
        return project
    }

    return updateCollectionById(project, collectionId, (currentCollection) => ({
        ...currentCollection,
        indexes: [...currentCollection.indexes, createIndex([createIndexKey(freeField.id)])]
    }))
}

/**
 * changes the keys and or the unique setting of an index.
 * @param {import("../models/factories.js").Project} project current project
 * @param {string} collectionId id of the collection that owns the index
 * @param {string} indexId id of the index
 * @param {{ keys?: import("../models/factories.js").IndexKey[], unique?: boolean }} changes what to change
 * @returns {import("../models/factories.js").Project} same project when the change is not allowed
 */
export function updateIndexInProject(project, collectionId, indexId, changes) {
    const collection = project.collections.find((candidate) => candidate.id === collectionId)
    const currentIndex = collection?.indexes.find((index) => index.id === indexId)

    if (!collection || !currentIndex) {
        return project
    }

    const nextKeys = changes.keys ?? currentIndex.keys
    const nextUnique = changes.unique ?? currentIndex.unique

    if (changes.keys) {
        const isDuplicate = collection.indexes.some(
            (index) => index.id !== indexId && haveSameKeys(index.keys, nextKeys)
        )

        if (!areIndexKeysValid(collection, nextKeys) || isDuplicate) {
            return project
        }
    }

    return updateCollectionById(project, collectionId, (currentCollection) => ({
        ...currentCollection,
        indexes: currentCollection.indexes.map((index) =>
            index.id === indexId
                ? {
                    ...index,
                    keys: nextKeys,
                    unique: Boolean(nextUnique)
                }
                : index
        )
    }))
}

/**
 * deletes an index, the fields stay.
 * @param {import("../models/factories.js").Project} project current project
 * @param {string} collectionId id of the collection that owns the index
 * @param {string} indexId id of the index
 * @returns {import("../models/factories.js").Project}
 */
export function deleteIndexFromProject(project, collectionId, indexId) {
    return updateCollectionById(project, collectionId, (collection) => ({
        ...collection,
        indexes: collection.indexes.filter((index) => index.id !== indexId)
    }))
}
