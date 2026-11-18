/**
 * saves the diagram as a png image.
 * it takes the whole diagram, not only the part that is on screen: the viewport element of react
 * flow is moved so the top left of all cards sits in the corner of the image, then drawn
 * to a png by the html-to-image library.
 * html-to-image is loaded only when the button is used, so it does not slow down the app.
 */
import { getNodesBounds } from "@xyflow/react"
import { downloadBlob } from "./download-file.js"

// empty space around the cards, in pixels, wide enough for the threads that leave the cards
const IMAGE_PADDING = 90

// the image is drawn at this scale, 2 keeps the text sharp
const IMAGE_PIXEL_RATIO = 2

// no side of the image is longer than this, in css pixels, browsers cannot draw bigger canvases
const MAX_IMAGE_SIDE = 6000

// file name of the image
const IMAGE_FILE_NAME = "nosql-modeler-diagram.png"

/**
 * draws the diagram to a png and downloads it.
 * @param {Array} nodes react flow nodes (with measured sizes), from useReactFlow().getNodes()
 * @returns {Promise<string | null>} an error message, or null when the image was saved
 */
export async function exportCanvasPng(nodes) {
    const viewportElement = document.querySelector(".diagram-canvas .react-flow__viewport")

    if (!viewportElement || nodes.length === 0) {
        return "there is nothing to draw yet"
    }

    const bounds = getNodesBounds(nodes)
    const imageWidth = Math.ceil(bounds.width + IMAGE_PADDING * 2)
    const imageHeight = Math.ceil(bounds.height + IMAGE_PADDING * 2)

    if (imageWidth > MAX_IMAGE_SIDE || imageHeight > MAX_IMAGE_SIDE) {
        return "the diagram is too large to save as one image, move the collections closer together"
    }

    try {
        const { toBlob } = await import("html-to-image")
        const backgroundColor = getComputedStyle(document.documentElement)
            .getPropertyValue("--color-background")
            .trim()

        const imageBlob = await toBlob(viewportElement, {
            backgroundColor,
            width: imageWidth,
            height: imageHeight,
            pixelRatio: IMAGE_PIXEL_RATIO,
            style: {
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                transform: `translate(${IMAGE_PADDING - bounds.x}px, ${IMAGE_PADDING - bounds.y}px) scale(1)`
            }
        })

        if (!imageBlob) {
            return "the image could not be drawn"
        }

        downloadBlob(IMAGE_FILE_NAME, imageBlob)

        return null
    } catch (error) {
        console.error("png export error:", error)

        return "the image could not be drawn, see the console for details"
    }
}
