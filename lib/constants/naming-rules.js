/**
 * naming rules for collections and fields.
 * these follow the mongodb naming restrictions and the common convention of
 * camelCase or snake_case names, so no spaces, hyphens, dots or $ signs.
 * change the patterns here to make the rules stricter or looser.
 */

// longest collection name the ui accepts (mongodb allows up to 120 bytes for the namespace)
const COLLECTION_NAME_MAX_LENGTH = 120

// longest field name the ui accepts
const FIELD_NAME_MAX_LENGTH = 64

// characters a name may contain: letters, numbers and underscores
const ALLOWED_NAME_CHARACTERS_PATTERN = /^[a-zA-Z0-9_]+$/

// a collection name must start with a letter
const COLLECTION_NAME_START_PATTERN = /^[a-zA-Z]/

// a field name must start with a letter or an underscore
const FIELD_NAME_START_PATTERN = /^[a-zA-Z_]/

export {
    COLLECTION_NAME_MAX_LENGTH,
    FIELD_NAME_MAX_LENGTH,
    ALLOWED_NAME_CHARACTERS_PATTERN,
    COLLECTION_NAME_START_PATTERN,
    FIELD_NAME_START_PATTERN
}
