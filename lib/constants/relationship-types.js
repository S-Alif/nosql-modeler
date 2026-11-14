/**
 * constants for relationships between collections.
 *
 * a "reference" stores the _id of a document of the target collection in a field
 * of the source collection. an "embed" stores the target document itself inside
 * a field (an object or an array of objects) of the source collection.
 * the cardinality is not stored, it comes from the source field: an array
 * means "many", anything else means "one".
 */

// relationship types
const REFERENCE_RELATIONSHIP = "reference"
const EMBED_RELATIONSHIP = "embed"
const RELATIONSHIP_TYPES = [REFERENCE_RELATIONSHIP, EMBED_RELATIONSHIP]

// cardinalities
const CARDINALITY_ONE = "one"
const CARDINALITY_MANY = "many"
const CARDINALITIES = [CARDINALITY_ONE, CARDINALITY_MANY]

export {
    REFERENCE_RELATIONSHIP,
    EMBED_RELATIONSHIP,
    RELATIONSHIP_TYPES,
    CARDINALITY_ONE,
    CARDINALITY_MANY,
    CARDINALITIES
}
