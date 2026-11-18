/**
 * saves the diagram as a png image or a pdf file.
 * it takes the whole diagram, not only the part that is on screen:
 *  1. the cards and threads (the react flow viewport element) are drawn to a transparent canvas
 *     by the html-to-image library, moved so the top left card sits a little away from the corner
 *  2. the background color and, when asked for, the dot grid are drawn on a fresh canvas
 *  3. the drawn diagram is put on top of it
 *  4. the result is saved as a png, or packed into a pdf page
 * card shadows are switched off while drawing by adding a class to the canvas (see global.css).
 * html-to-image is loaded only when the button is first used, so it does not slow down the app.
 */
import { getNodesBounds } from "@xyflow/react"
import {
    GRID_DOT_SIZE,
    GRID_GAP,
    IMAGE_PADDING,
    MAX_IMAGE_PIXELS,
    MAX_IMAGE_SIDE,
    PDF_FILE_NAME,
    PDF_IMAGE_FORMAT,
    PDF_PIXEL_RATIO,
    PNG_FILE_NAME,
    PNG_PIXEL_RATIO
} from "../constants/image-export.js"
import {
    createImagePdf,
    getPaperLayout
} from "./create-pdf.js"
import { downloadBlob } from "./download-file.js"

// class on the canvas element that removes the shadow under the cards
const NO_SHADOW_CLASS = "export-no-shadow"

/**
 * reads a css variable from the page.
 * @param {string} variableName name like "--color-background"
 * @param {string} fallbackValue value to use when the variable is empty
 * @returns {string}
 */
function readCssVariable(variableName, fallbackValue) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallbackValue
}

/**
 * turns a #rrggbb color into three numbers from 0 to 1, the way pdf wants colors.
 * @param {string} hexColor color like "#0e1612", anything else gives white
 * @returns {{ red: number, green: number, blue: number }}
 */
export function parseHexColor(hexColor) {
    const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hexColor)

    if (!match) {
        return {
            red: 1,
            green: 1,
            blue: 1
        }
    }

    return {
        red: parseInt(match[1], 16) / 255,
        green: parseInt(match[2], 16) / 255,
        blue: parseInt(match[3], 16) / 255
    }
}

/**
 * picks how many pixels are drawn per css pixel, never more than the browser can draw.
 * @param {number} wantedRatio the ratio that is wanted for the format
 * @param {number} imageWidth width of the image in css pixels
 * @param {number} imageHeight height of the image in css pixels
 * @returns {number} a ratio of at least 1
 */
export function pickPixelRatio(wantedRatio, imageWidth, imageHeight) {
    const ratioForPixels = Math.sqrt(MAX_IMAGE_PIXELS / (imageWidth * imageHeight))
    const ratioForSide = 8192 / Math.max(imageWidth, imageHeight)

    return Math.max(1, Math.min(wantedRatio, ratioForPixels, ratioForSide))
}

/**
 * draws the dot grid on a canvas, lined up with world coordinates like the grid on screen.
 * @param {CanvasRenderingContext2D} context drawing context of the output canvas
 * @param {{ x: number, y: number }} worldOrigin world position of the top left of the image
 * @param {number} imageWidth width of the image in css pixels
 * @param {number} imageHeight height of the image in css pixels
 * @param {number} pixelRatio pixels per css pixel
 * @param {string} dotColor color of the dots
 */
export function drawGrid(context, worldOrigin, imageWidth, imageHeight, pixelRatio, dotColor) {
    const firstX = (GRID_GAP - (worldOrigin.x % GRID_GAP)) % GRID_GAP
    const firstY = (GRID_GAP - (worldOrigin.y % GRID_GAP)) % GRID_GAP

    context.fillStyle = dotColor

    for (let dotX = firstX; dotX < imageWidth; dotX += GRID_GAP) {
        for (let dotY = firstY; dotY < imageHeight; dotY += GRID_GAP) {
            context.beginPath()
            context.arc(dotX * pixelRatio, dotY * pixelRatio, (GRID_DOT_SIZE / 2) * pixelRatio, 0, Math.PI * 2)
            context.fill()
        }
    }
}

/**
 * waits until the browser has drawn the page twice, so changes made just before are on screen.
 * @returns {Promise<void>}
 */
export function waitForRepaint() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
}

/**
 * draws the diagram and saves it.
 * @param {Array} nodes react flow nodes (with measured sizes), from useReactFlow().getNodes()
 * @param {{ format: string, showGrid: boolean, showShadows: boolean, paper: string }} options what to save, see DEFAULT_IMAGE_OPTIONS
 * @returns {Promise<string | null>} an error message, or null when the file was saved
 */
export async function exportCanvasImage(nodes, options) {
    const canvasElement = document.querySelector(".diagram-canvas")
    const viewportElement = canvasElement?.querySelector(".react-flow__viewport")

    if (!viewportElement || nodes.length === 0) {
        return "there is nothing to draw yet"
    }

    const bounds = getNodesBounds(nodes)
    const imageWidth = Math.ceil(bounds.width + IMAGE_PADDING * 2)
    const imageHeight = Math.ceil(bounds.height + IMAGE_PADDING * 2)

    if (imageWidth > MAX_IMAGE_SIDE || imageHeight > MAX_IMAGE_SIDE) {
        return "the diagram is too large to save as one image, move the collections closer together"
    }

    const isPdf = options.format === PDF_IMAGE_FORMAT
    const pixelRatio = pickPixelRatio(isPdf ? PDF_PIXEL_RATIO : PNG_PIXEL_RATIO, imageWidth, imageHeight)

    try {
        const { toCanvas } = await import("html-to-image")

        // draw the cards and threads, without a background so the grid can go underneath
        if (!options.showShadows) {
            canvasElement.classList.add(NO_SHADOW_CLASS)
        }

        let diagramCanvas

        try {
            await waitForRepaint()
            diagramCanvas = await toCanvas(viewportElement, {
                width: imageWidth,
                height: imageHeight,
                pixelRatio,
                style: {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: `translate(${IMAGE_PADDING - bounds.x}px, ${IMAGE_PADDING - bounds.y}px) scale(1)`
                }
            })
        } finally {
            canvasElement.classList.remove(NO_SHADOW_CLASS)
        }

        // background, grid and diagram on one canvas
        const outputCanvas = document.createElement("canvas")

        outputCanvas.width = diagramCanvas.width
        outputCanvas.height = diagramCanvas.height

        const context = outputCanvas.getContext("2d")
        const backgroundColor = readCssVariable("--color-background", "#ffffff")

        context.fillStyle = backgroundColor
        context.fillRect(0, 0, outputCanvas.width, outputCanvas.height)

        if (options.showGrid) {
            drawGrid(
                context,
                {
                    x: bounds.x - IMAGE_PADDING,
                    y: bounds.y - IMAGE_PADDING
                },
                imageWidth,
                imageHeight,
                outputCanvas.width / imageWidth,
                readCssVariable("--color-grid", "#cccccc")
            )
        }

        context.drawImage(diagramCanvas, 0, 0)

        if (!isPdf) {
            const imageBlob = await new Promise((resolve) => outputCanvas.toBlob(resolve, "image/png"))

            if (!imageBlob) {
                return "the image could not be drawn"
            }

            downloadBlob(PNG_FILE_NAME, imageBlob)

            return null
        }

        // pdf: drop the alpha channel (the background is solid) and pack the pixels into a page
        const rgbaPixels = context.getImageData(0, 0, outputCanvas.width, outputCanvas.height).data
        const rgbPixels = new Uint8Array((rgbaPixels.length / 4) * 3)

        for (let pixelIndex = 0; pixelIndex < rgbaPixels.length / 4; pixelIndex += 1) {
            rgbPixels[pixelIndex * 3] = rgbaPixels[pixelIndex * 4]
            rgbPixels[pixelIndex * 3 + 1] = rgbaPixels[pixelIndex * 4 + 1]
            rgbPixels[pixelIndex * 3 + 2] = rgbaPixels[pixelIndex * 4 + 2]
        }

        const pdfBytes = await createImagePdf({
            pixelWidth: outputCanvas.width,
            pixelHeight: outputCanvas.height,
            rgbPixels,
            layout: getPaperLayout(options.paper, imageWidth, imageHeight),
            pageColor: parseHexColor(backgroundColor)
        })

        downloadBlob(PDF_FILE_NAME, new Blob([pdfBytes], { type: "application/pdf" }))

        return null
    } catch (error) {
        console.error("image export error:", error)

        return "the file could not be drawn, see the console for details"
    }
}
