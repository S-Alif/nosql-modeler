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

// line width of the selected thread (click it, then press delete to remove it)
const SELECTED_EDGE_STROKE_WIDTH = 4.5

// color of an edge whose two fields do not fit together (different types)
const WARNING_EDGE_COLOR = "#d4303f"

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
    SELECTED_EDGE_STROKE_WIDTH,
    WARNING_EDGE_COLOR
}
