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

// react flow edge type name used for relationship threads (components/canvas/relationship-edge.jsx)
const RELATIONSHIP_EDGE_TYPE = "relationship"

// width of a card that has not been measured yet, in pixels
const DEFAULT_CARD_WIDTH = 230

// two cards need at least this much room between them (in pixels) for a thread to run
// from the facing sides, closer or overlapping cards connect on the same side instead
const EDGE_MIN_SIDE_GAP = 60

// how far a thread leaves a card before it turns, in pixels, and the extra length per lane
const EDGE_STUB_LENGTH = 26
const EDGE_STUB_LANE_STEP = 9

// corner rounding of the threads, in pixels
const EDGE_BORDER_RADIUS = 10

// threads are spread over this many lanes so the vertical parts of different threads do not
// sit on top of each other, each lane shifts the thread by EDGE_LANE_SPACING pixels
const EDGE_LANE_COUNT = 5
const EDGE_LANE_SPACING = 12

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
    WARNING_EDGE_COLOR,
    RELATIONSHIP_EDGE_TYPE,
    DEFAULT_CARD_WIDTH,
    EDGE_MIN_SIDE_GAP,
    EDGE_STUB_LENGTH,
    EDGE_STUB_LANE_STEP,
    EDGE_BORDER_RADIUS,
    EDGE_LANE_COUNT,
    EDGE_LANE_SPACING
}
