/**
 * constants for relationships between collections.
 *
 * relationships connect two fields. the source field belongs to the collection that
 * holds the link, the target field is the field it points at.
 * a "reference" stores the value of the target field (usually the _id) of a document of the
 * target collection in the source field. an "embed" stores the target document itself
 * inside the source field (an object or an array of objects), it ends at the target card
 * because it has no single target field.
 */

// relationship types
const REFERENCE_RELATIONSHIP = "reference"
const EMBED_RELATIONSHIP = "embed"
const RELATIONSHIP_TYPES = [REFERENCE_RELATIONSHIP, EMBED_RELATIONSHIP]

export {
    REFERENCE_RELATIONSHIP,
    EMBED_RELATIONSHIP,
    RELATIONSHIP_TYPES
}
