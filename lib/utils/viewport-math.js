/**
 * math for react flow viewports.
 * react flow describes the view as a transform: [translateX, translateY, zoom],
 * where a point on the canvas is shown at (point * zoom + translate) on screen.
 */

/**
 * finds the canvas point that is in the middle of the visible canvas area.
 * @param {number} paneWidth width of the canvas area in pixels
 * @param {number} paneHeight height of the canvas area in pixels
 * @param {[number, number, number]} transform react flow transform: translateX, translateY, zoom
 * @returns {{ x: number, y: number }} point in canvas coordinates
 */
export function calculateViewportCenter(paneWidth, paneHeight, transform) {
    const [translateX, translateY, zoom] = transform

    return {
        x: (paneWidth / 2 - translateX) / zoom,
        y: (paneHeight / 2 - translateY) / zoom
    }
}
