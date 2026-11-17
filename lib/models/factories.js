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
 * @property {string} description optional note about what the field is for
 * @property {boolean} isSystem true for the automatic _id field, which cannot be renamed, made optional, moved or deleted
 * @property {string} itemType type of the array items, used when type is "array"
 * @property {FieldOptions} options mongoose style rules and the ttl setting, see createFieldOptions
 * @property {Field[]} children nested fields, used by "object" fields and arrays of objects
 *
 * @typedef {Object} FieldOptions
 * @property {string[]} enumValues allowed values (strings, or numbers typed as text), empty means any value
 * @property {string} minLength shortest text length as typed text, empty means no limit (text fields)
 * @property {string} maxLength longest text length as typed text, empty means no limit (text fields)
 * @property {string} min lowest number or earliest date as typed text, empty means no limit
 * @property {string} max highest number or latest date as typed text, empty means no limit
 * @property {string} match regular expression the text must match, empty means none (text fields)
 * @property {boolean} trim remove spaces around the text when saving (text fields)
 * @property {boolean} lowercase save the text in lower case (text fields)
 * @property {boolean} uppercase save the text in upper case (text fields)
 * @property {string} ttlValue time to live as typed text, empty means no ttl (date fields)
 * @property {string} ttlUnit unit of ttlValue: seconds, minutes, hours or days
 *
 * @typedef {Object} Collection
 * @property {string} id unique id
 * @property {string} name collection name
 * @property {Position} position top left position on the canvas
 * @property {Field[]} fields top level fields of the collection
 * @property {Index[]} indexes indexes of the collection, see createIndex
 *
 * @typedef {Object} IndexKey
 * @property {string} fieldId id of the indexed field (any depth)
 * @property {number} direction 1 for ascending, -1 for descending
 *
 * @typedef {Object} Index
 * @property {string} id unique id
 * @property {IndexKey[]} keys indexed fields in order, one key is a single field index, more is a compound index
 * @property {boolean} unique true when no two documents may hold the same values
 *
 * @typedef {Object} Relationship
 * @property {string} id unique id
 * @property {string} type "reference" (stores the value of the target field) or "embed" (stores the target document)
 * @property {string} sourceCollectionId collection that owns the source field
 * @property {string} sourceFieldId field that holds the reference or the embedded document
 * @property {string} targetCollectionId collection that is referenced or embedded
 * @property {string | null} targetFieldId field of the target collection that is referenced (usually its _id), null for an embed
 *
 * @typedef {Object} Project
 * @property {number} schemaVersion version of this shape
 * @property {Collection[]} collections all collections
 * @property {Relationship[]} relationships links between collections
 */
import { SCHEMA_VERSION } from "../constants/storage-keys.js"
import {
    DEFAULT_ARRAY_ITEM_TYPE,
    DEFAULT_FIELD_TYPE,
    ID_FIELD_NAME,
    ID_FIELD_TYPE
} from "../constants/field-types.js"
import { DEFAULT_TTL_UNIT } from "../constants/field-options.js"
import { DEFAULT_INDEX_DIRECTION } from "../constants/index-options.js"
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
 * creates a new collection that only has the automatic _id field and no indexes.
 * @param {string} name collection name
 * @param {Position} [position] canvas position, defaults to the origin
 * @returns {Collection}
 */
export function createCollection(name, position = createOriginPosition()) {
    return {
        id: generateId("col"),
        name,
        position,
        fields: [createIdField()],
        indexes: []
    }
}

/**
 * creates the options of a field with nothing set.
 * only the options that fit the value type of a field are shown and exported,
 * see lib/utils/field-options.js.
 * @returns {FieldOptions}
 */
export function createFieldOptions() {
    return {
        enumValues: [],
        minLength: "",
        maxLength: "",
        min: "",
        max: "",
        match: "",
        trim: false,
        lowercase: false,
        uppercase: false,
        ttlValue: "",
        ttlUnit: DEFAULT_TTL_UNIT
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
        description: "",
        isSystem: false,
        itemType: DEFAULT_ARRAY_ITEM_TYPE,
        options: createFieldOptions(),
        children: []
    }
}

/**
 * creates the _id field every collection starts with.
 * it is a system field: always required, cannot be renamed, moved or deleted,
 * only its type can be changed.
 * @returns {Field}
 */
export function createIdField() {
    return {
        ...createField(ID_FIELD_NAME, ID_FIELD_TYPE),
        required: true,
        isSystem: true
    }
}

/**
 * creates an index on one or more fields.
 * @param {IndexKey[]} keys indexed fields in order
 * @param {boolean} [unique] true for a unique index, defaults to false
 * @returns {Index}
 */
export function createIndex(keys, unique = false) {
    return {
        id: generateId("idx"),
        keys,
        unique
    }
}

/**
 * creates one index key, ascending unless a direction is given.
 * @param {string} fieldId id of the indexed field
 * @param {number} [direction] 1 for ascending, -1 for descending
 * @returns {IndexKey}
 */
export function createIndexKey(fieldId, direction = DEFAULT_INDEX_DIRECTION) {
    return {
        fieldId,
        direction
    }
}

/**
 * creates a relationship between two fields.
 * @param {Object} relationshipDetails
 * @param {string} relationshipDetails.type "reference" or "embed"
 * @param {string} relationshipDetails.sourceCollectionId collection that owns the field
 * @param {string} relationshipDetails.sourceFieldId field that holds the reference or embedded document
 * @param {string} relationshipDetails.targetCollectionId collection that is referenced or embedded
 * @param {string | null} [relationshipDetails.targetFieldId] field that is referenced, null for an embed
 * @returns {Relationship}
 */
export function createRelationship({
    type,
    sourceCollectionId,
    sourceFieldId,
    targetCollectionId,
    targetFieldId = null
}) {
    return {
        id: generateId("rel"),
        type,
        sourceCollectionId,
        sourceFieldId,
        targetCollectionId,
        targetFieldId
    }
}
