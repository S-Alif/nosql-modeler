/**
 * constants for collection indexes.
 * an index is a list of keys (field plus direction), one key is a single field index,
 * more than one is a compound index. the order of the keys matters.
 */

// sort direction of an index key, the numbers are what mongodb stores
const ASCENDING_DIRECTION = 1
const DESCENDING_DIRECTION = -1

// directions with the label the inspector shows
const INDEX_DIRECTIONS = [
    {
        value: ASCENDING_DIRECTION,
        label: "ascending"
    },
    {
        value: DESCENDING_DIRECTION,
        label: "descending"
    }
]

// direction a new index key starts with
const DEFAULT_INDEX_DIRECTION = ASCENDING_DIRECTION

// mongodb allows at most 32 keys in one compound index
const MAX_INDEX_KEYS = 32

export {
    ASCENDING_DIRECTION,
    DESCENDING_DIRECTION,
    INDEX_DIRECTIONS,
    DEFAULT_INDEX_DIRECTION,
    MAX_INDEX_KEYS
}
