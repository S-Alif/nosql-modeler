/**
 * factory functions that build the core data shapes of the modeler.
 * always create entities through these so every object has the same shape.
 *
 * @typedef {Object} Position
 * @property {number} x horizontal canvas position
 * @property {number} y vertical canvas position
 *
 * @typedef {Object} Field
 * @property {string} id unique id
 * @property {string} name field name
 * @property {string} type one of FIELD_TYPES (lib/constants/field-types.js)
 * @property {boolean} required true when the field must be present
 * @property {string} defaultValue default as typed text, empty string means no default
 * @property {string} itemType type of the array items, used when type is "array"
 * @property {Field[]} children nested fields, used by "object" fields and arrays of objects
 *
 * @typedef {Object} Collection
 * @property {string} id unique id
 * @property {string} name collection name
 * @property {Position} position top left position on the canvas
 * @property {Field[]} fields top level fields of the collection
 * @property {Array} indexes indexes of the collection (batch 6)
 *
 * @typedef {Object} Project
 * @property {number} schemaVersion version of this shape
 * @property {Collection[]} collections all collections
 * @property {Array} relationships links between collections (batch 5)
 */
import { SCHEMA_VERSION } from "../constants/storage-keys.js"
import {
    DEFAULT_ARRAY_ITEM_TYPE,
    DEFAULT_FIELD_TYPE
} from "../constants/field-types.js"
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
 * creates a canvas position at the origin.
 * @returns {Position}
 */
function createOriginPosition() {
    return {
        x: 0,
        y: 0
    }
}

/**
 * creates a new collection with no fields and no indexes.
 * @param {string} name collection name
 * @param {Position} [position] canvas position, defaults to the origin
 * @returns {Collection}
 */
export function createCollection(name, position = createOriginPosition()) {
    return {
        id: generateId("col"),
        name,
        position,
        fields: [],
        indexes: []
    }
}

/**
 * creates a new field with no default value and no nested fields.
 * @param {string} name field name
 * @param {string} [type] field type, defaults to string
 * @returns {Field}
 */
export function createField(name, type = DEFAULT_FIELD_TYPE) {
    return {
        id: generateId("fld"),
        name,
        type,
        required: false,
        defaultValue: "",
        itemType: DEFAULT_ARRAY_ITEM_TYPE,
        children: []
    }
}
