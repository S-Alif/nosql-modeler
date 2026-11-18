/**
 * builds a pdf file that holds one picture on one page, without any library.
 * the picture is stored as raw rgb pixels packed with deflate (what pdf calls FlateDecode),
 * which is lossless: the pixels in the pdf are exactly the pixels that were drawn.
 */
import {
    FIT_PAPER,
    PAPER_SIZES,
    PDF_PAGE_MARGIN,
    POINTS_PER_CSS_PIXEL
} from "../constants/image-export.js"

/**
 * works out the page and where the picture sits on it, in pdf points.
 * a paper size turns to landscape when the diagram is wider than tall, and the diagram is scaled
 * to fit inside the margins and centered. "fit" makes the page exactly as big as the diagram.
 * @param {string} paperId id of a paper size, see PAPER_SIZES
 * @param {number} diagramWidth width of the diagram in css pixels
 * @param {number} diagramHeight height of the diagram in css pixels
 * @returns {{ pageWidth: number, pageHeight: number, imageX: number, imageY: number, imageWidth: number, imageHeight: number }}
 *   imageY is measured from the bottom of the page, like pdf does
 */
export function getPaperLayout(paperId, diagramWidth, diagramHeight) {
    const paper = PAPER_SIZES.find((candidate) => candidate.id === paperId)

    if (!paper || paper.id === FIT_PAPER) {
        const fitWidth = diagramWidth * POINTS_PER_CSS_PIXEL
        const fitHeight = diagramHeight * POINTS_PER_CSS_PIXEL

        return {
            pageWidth: fitWidth,
            pageHeight: fitHeight,
            imageX: 0,
            imageY: 0,
            imageWidth: fitWidth,
            imageHeight: fitHeight
        }
    }

    const isLandscape = diagramWidth > diagramHeight
    const pageWidth = isLandscape ? paper.height : paper.width
    const pageHeight = isLandscape ? paper.width : paper.height
    const scale = Math.min(
        (pageWidth - PDF_PAGE_MARGIN * 2) / diagramWidth,
        (pageHeight - PDF_PAGE_MARGIN * 2) / diagramHeight
    )
    const imageWidth = diagramWidth * scale
    const imageHeight = diagramHeight * scale

    return {
        pageWidth,
        pageHeight,
        imageX: (pageWidth - imageWidth) / 2,
        imageY: (pageHeight - imageHeight) / 2,
        imageWidth,
        imageHeight
    }
}

/**
 * packs bytes with deflate, using the compression the browser ships with.
 * @param {Uint8Array} bytes data to pack
 * @returns {Promise<Uint8Array>} zlib packed bytes
 */
export async function deflateBytes(bytes) {
    const packedStream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"))

    return new Uint8Array(await new Response(packedStream).arrayBuffer())
}

/**
 * formats a number for a pdf content stream.
 * @param {number} value number to write
 * @returns {string}
 */
function formatNumber(value) {
    return Number(value.toFixed(3)).toString()
}

/**
 * creates a pdf with one page and one picture.
 * @param {Object} pdfSettings what to put in the pdf
 * @param {number} pdfSettings.pixelWidth width of the picture in pixels
 * @param {number} pdfSettings.pixelHeight height of the picture in pixels
 * @param {Uint8Array} pdfSettings.rgbPixels pixels as r, g, b bytes row by row (no alpha)
 * @param {{ pageWidth: number, pageHeight: number, imageX: number, imageY: number, imageWidth: number, imageHeight: number }} pdfSettings.layout page and picture size from getPaperLayout
 * @param {{ red: number, green: number, blue: number }} pdfSettings.pageColor color of the page behind the picture, 0 to 1 per channel
 * @returns {Promise<Uint8Array>} the bytes of the pdf file
 */
export async function createImagePdf({ pixelWidth, pixelHeight, rgbPixels, layout, pageColor }) {
    const encoder = new TextEncoder()
    const packedPixels = await deflateBytes(rgbPixels)

    // page content: fill the page with the background color, then place the picture
    const contentText = [
        "q",
        `${formatNumber(pageColor.red)} ${formatNumber(pageColor.green)} ${formatNumber(pageColor.blue)} rg`,
        `0 0 ${formatNumber(layout.pageWidth)} ${formatNumber(layout.pageHeight)} re f`,
        `${formatNumber(layout.imageWidth)} 0 0 ${formatNumber(layout.imageHeight)} ${formatNumber(layout.imageX)} ${formatNumber(layout.imageY)} cm`,
        "/Im0 Do",
        "Q"
    ].join("\n")

    // the objects of the file in order, object 1 is the first one
    const objects = [
        encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"),
        encoder.encode("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
        encoder.encode(
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatNumber(layout.pageWidth)} ${formatNumber(layout.pageHeight)}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`
        ),
        encoder.encode(`<< /Length ${contentText.length} >>\nstream\n${contentText}\nendstream`),
        concatBytes([
            encoder.encode(
                `<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${packedPixels.length} >>\nstream\n`
            ),
            packedPixels,
            encoder.encode("\nendstream")
        ])
    ]

    // write header, objects and the cross reference table that lists where every object starts
    const parts = [encoder.encode("%PDF-1.4\n")]
    const objectOffsets = []
    let writtenLength = parts[0].length

    objects.forEach((objectBytes, objectIndex) => {
        const objectStart = encoder.encode(`${objectIndex + 1} 0 obj\n`)
        const objectEnd = encoder.encode("\nendobj\n")

        objectOffsets.push(writtenLength)
        parts.push(objectStart, objectBytes, objectEnd)
        writtenLength += objectStart.length + objectBytes.length + objectEnd.length
    })

    const crossReferenceLines = [
        "xref",
        `0 ${objects.length + 1}`,
        "0000000000 65535 f ",
        ...objectOffsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n `)
    ]

    parts.push(
        encoder.encode(
            `${crossReferenceLines.join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${writtenLength}\n%%EOF\n`
        )
    )

    return concatBytes(parts)
}

/**
 * joins byte arrays into one.
 * @param {Uint8Array[]} parts arrays to join
 * @returns {Uint8Array}
 */
function concatBytes(parts) {
    const joinedBytes = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
    let writePosition = 0

    parts.forEach((part) => {
        joinedBytes.set(part, writePosition)
        writePosition += part.length
    })

    return joinedBytes
}
