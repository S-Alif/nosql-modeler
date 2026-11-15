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

// relationship edge colors, a reference is blue and an embed is amber
// (mid tones that stay readable on both the light and the dark canvas)
const REFERENCE_EDGE_COLOR = "#3f7cf4"
const EMBED_EDGE_COLOR = "#e08a00"

// edge line widths, edges that touch the selected collection are thicker
const EDGE_STROKE_WIDTH = 1.5
const ACTIVE_EDGE_STROKE_WIDTH = 3

// color of an edge whose two fields do not fit together (different types)
const WARNING_EDGE_COLOR = "#d4303f"

// react flow edge type name used for relationship edges
const RELATIONSHIP_EDGE_TYPE = "relationship"

// distance of the 1 and N marks from the card edge, in pixels
const EDGE_BADGE_OFFSET = 16

// react flow marker type of the arrow head (the value of MarkerType.ArrowClosed)
const EDGE_ARROW_MARKER_TYPE = "arrowclosed"

export {
    COLLECTION_NODE_TYPE,
    CANVAS_MIN_ZOOM,
    CANVAS_MAX_ZOOM,
    NEW_COLLECTION_HALF_WIDTH,
    NEW_COLLECTION_HALF_HEIGHT,
    NEW_COLLECTION_CASCADE_OFFSET,
    REFERENCE_EDGE_COLOR,
    EMBED_EDGE_COLOR,
    EDGE_STROKE_WIDTH,
    ACTIVE_EDGE_STROKE_WIDTH,
    EDGE_ARROW_MARKER_TYPE,
    WARNING_EDGE_COLOR,
    RELATIONSHIP_EDGE_TYPE,
    EDGE_BADGE_OFFSET
}
