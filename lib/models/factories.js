/**
 * factory functions that build the core data shapes of the modeler.
 * always create entities through these so every object has the same shape.
 *
 * @typedef {Object} Position
 * @property {number} x horizontal canvas position
 * @property {number} y vertical canvas position
 *
 * @typedef {Object} Collection
 * @property {string} id unique id
 * @property {string} name collection name
 * @property {Position} position top left position on the canvas
 * @property {Array} fields fields of the collection (batch 4)
 * @property {Array} indexes indexes of the collection (batch 6)
 *
 * @typedef {Object} Project
 * @property {number} schemaVersion version of this shape
 * @property {Collection[]} collections all collections
 * @property {Array} relationships links between collections (batch 5)
 */
import { SCHEMA_VERSION } from "../constants/storage-keys.js"
import { generateId } from "../utils/generate-id.js"

/**
 * creates an empty project with no collections.
 * @returns {Project}
 */
export function createEmptyProject() {
    return {
        schemaVersion: SCHEMA_VERSION,
        collections: [],
        relationships: []
    }
}

/**
 * creates a new collection with no fields and no indexes.
 * @param {string} name collection name
 * @param {Position} [position] canvas position, defaults to the origin
 * @returns {Collection}
 */
export function createCollection(name, position = { x: 0, y: 0 }) {
    return {
        id: generateId("col"),
        name,
        position,
        fields: [],
        indexes: []
    }
}
