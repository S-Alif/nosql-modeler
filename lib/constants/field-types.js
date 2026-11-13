/**
 * constants for field types.
 * the type names follow the bson type names used by mongodb.
 */

// type name of a field that holds nested fields
const OBJECT_FIELD_TYPE = "object"

// type name of a field that holds a list of items
const ARRAY_FIELD_TYPE = "array"

// every type a field can have
const FIELD_TYPES = [
    "string",
    "int",
    "long",
    "double",
    "decimal",
    "boolean",
    "date",
    "objectId",
    "object",
    "array",
    "binData",
    "mixed"
]

// types an array can hold, arrays of arrays are not supported
const ARRAY_ITEM_TYPES = FIELD_TYPES.filter((fieldType) => fieldType !== ARRAY_FIELD_TYPE)

// type given to a newly added field
const DEFAULT_FIELD_TYPE = "string"

// item type given to a field when it becomes an array
const DEFAULT_ARRAY_ITEM_TYPE = "string"

// types that can have a default value
const TYPES_WITH_DEFAULT_VALUE = [
    "string",
    "int",
    "long",
    "double",
    "decimal",
    "boolean",
    "date"
]

export {
    OBJECT_FIELD_TYPE,
    ARRAY_FIELD_TYPE,
    FIELD_TYPES,
    ARRAY_ITEM_TYPES,
    DEFAULT_FIELD_TYPE,
    DEFAULT_ARRAY_ITEM_TYPE,
    TYPES_WITH_DEFAULT_VALUE
}
