/**
 * constants for saving the diagram as a png image or a pdf file.
 */

// ids of the two file formats
const PNG_IMAGE_FORMAT = "png"
const PDF_IMAGE_FORMAT = "pdf"

// the formats the image dialog offers, in this order
const IMAGE_FORMATS = [
    {
        id: PNG_IMAGE_FORMAT,
        label: "PNG image",
        description: "one image of the whole diagram"
    },
    {
        id: PDF_IMAGE_FORMAT,
        label: "PDF",
        description: "the diagram on a page, drawn in high resolution so it stays sharp when printed"
    }
]

// ids of the paper sizes
const FIT_PAPER = "fit"
const A4_PAPER = "a4"
const A3_PAPER = "a3"
const LETTER_PAPER = "letter"

// paper sizes in points (1 point is 1/72 inch), the fit size has no fixed page
const PAPER_SIZES = [
    {
        id: FIT_PAPER,
        label: "Same size as the diagram",
        width: 0,
        height: 0
    },
    {
        id: A4_PAPER,
        label: "A4",
        width: 595.28,
        height: 841.89
    },
    {
        id: A3_PAPER,
        label: "A3",
        width: 841.89,
        height: 1190.55
    },
    {
        id: LETTER_PAPER,
        label: "Letter",
        width: 612,
        height: 792
    }
]

// what the dialog starts with
const DEFAULT_IMAGE_OPTIONS = {
    format: PNG_IMAGE_FORMAT,
    showGrid: true,
    showShadows: true,
    paper: A4_PAPER
}

// empty space around the cards, in pixels, wide enough for the threads that leave the cards
const IMAGE_PADDING = 90

// the image is drawn at this many pixels per css pixel, the pdf is drawn sharper
const PNG_PIXEL_RATIO = 2
const PDF_PIXEL_RATIO = 3

// limits that keep the canvas inside what browsers can draw
const MAX_IMAGE_SIDE = 6000
const MAX_IMAGE_PIXELS = 36000000

// the dot grid, same spacing as the canvas, the size is the diameter of a dot
const GRID_GAP = 22
const GRID_DOT_SIZE = 1.8

// empty page border around the diagram in a pdf with a paper size, in points
const PDF_PAGE_MARGIN = 24

// css pixels are 1/96 inch, pdf points are 1/72 inch
const POINTS_PER_CSS_PIXEL = 0.75

// file names
const PNG_FILE_NAME = "nosql-modeler-diagram.png"
const PDF_FILE_NAME = "nosql-modeler-diagram.pdf"

export {
    PNG_IMAGE_FORMAT,
    PDF_IMAGE_FORMAT,
    IMAGE_FORMATS,
    FIT_PAPER,
    A4_PAPER,
    A3_PAPER,
    LETTER_PAPER,
    PAPER_SIZES,
    DEFAULT_IMAGE_OPTIONS,
    IMAGE_PADDING,
    PNG_PIXEL_RATIO,
    PDF_PIXEL_RATIO,
    MAX_IMAGE_SIDE,
    MAX_IMAGE_PIXELS,
    GRID_GAP,
    GRID_DOT_SIZE,
    PDF_PAGE_MARGIN,
    POINTS_PER_CSS_PIXEL,
    PNG_FILE_NAME,
    PDF_FILE_NAME
}
