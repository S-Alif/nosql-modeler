/**
 * provider component that owns the modeler state.
 * it runs the reducer, autosaves the project to local storage
 * after a short pause, and saves once more when the tab closes.
 */
import { useEffect, useMemo, useReducer, useRef } from "react"
import { SAVE_DEBOUNCE_MS } from "../../lib/constants/storage-keys.js"
import { ModelerContext } from "../../lib/state/modeler-context.js"
import {
    createInitialState,
    modelerReducer
} from "../../lib/state/modeler-reducer.js"
import { saveProject } from "../../lib/storage/local-storage.js"

/**
 * wraps the app and shares state through ModelerContext.
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
function ModelerProvider({ children }) {
    const [state, dispatch] = useReducer(modelerReducer, undefined, createInitialState)

    // always points at the newest project so the unload save never uses stale data
    const latestProjectRef = useRef(state.project)

    // debounced autosave, runs only when the project changes (not on selection changes)
    useEffect(() => {
        latestProjectRef.current = state.project

        const saveTimeoutId = setTimeout(() => {
            saveProject(state.project)
        }, SAVE_DEBOUNCE_MS)

        return () => clearTimeout(saveTimeoutId)
    }, [state.project])

    // save immediately when the tab is closed or reloaded
    useEffect(() => {
        function saveBeforeUnload() {
            saveProject(latestProjectRef.current)
        }

        window.addEventListener("beforeunload", saveBeforeUnload)

        return () => window.removeEventListener("beforeunload", saveBeforeUnload)
    }, [])

    // keep the context value stable between renders that did not change state
    const contextValue = useMemo(
        () => ({
            state,
            dispatch
        }),
        [state]
    )

    return (
        <ModelerContext.Provider value={contextValue}>
            {children}
        </ModelerContext.Provider>
    )
}

export default ModelerProvider
