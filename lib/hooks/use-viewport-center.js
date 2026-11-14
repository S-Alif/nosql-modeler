/**
 * hook that tells where the middle of the visible canvas is.
 * it must be used inside <ReactFlowProvider> (app.jsx provides it).
 */
import { useStoreApi } from "@xyflow/react"
import { useCallback } from "react"
import { calculateViewportCenter } from "../utils/viewport-math.js"

/**
 * returns a function that reads the current view when it is called,
 * so panning and zooming never re-render the component that uses it.
 * @returns {() => { x: number, y: number }} function that gives the visible center in canvas coordinates
 */
export function useViewportCenter() {
    const flowStoreApi = useStoreApi()

    return useCallback(() => {
        const { width, height, transform } = flowStoreApi.getState()

        return calculateViewportCenter(width, height, transform)
    }, [flowStoreApi])
}
