/**
 * constants for the react flow diagram canvas.
 */

// react flow node type name used for collection cards
const COLLECTION_NODE_TYPE = "collection"

// zoom limits of the canvas
const CANVAS_MIN_ZOOM = 0.2
const CANVAS_MAX_ZOOM = 2

// approximate half size of a new collection card, used to center it on the view
const NEW_COLLECTION_HALF_WIDTH = 90
const NEW_COLLECTION_HALF_HEIGHT = 40

// distance a new card moves when another card already sits at the same spot
const NEW_COLLECTION_CASCADE_OFFSET = 40

export {
    COLLECTION_NODE_TYPE,
    CANVAS_MIN_ZOOM,
    CANVAS_MAX_ZOOM,
    NEW_COLLECTION_HALF_WIDTH,
    NEW_COLLECTION_HALF_HEIGHT,
    NEW_COLLECTION_CASCADE_OFFSET
}
