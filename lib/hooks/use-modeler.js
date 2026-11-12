/**
 * hook for reading and changing the modeler state from any component.
 */
import { useContext } from "react"
import { ModelerContext } from "../state/modeler-context.js"

/**
 * returns the modeler state and dispatch function.
 * must be called inside <ModelerProvider>.
 * @returns {{ state: { project: object, selectedCollectionId: string | null }, dispatch: Function }}
 */
export function useModeler() {
    const modelerContextValue = useContext(ModelerContext)

    if (!modelerContextValue) {
        throw new Error("useModeler must be used inside ModelerProvider")
    }

    return modelerContextValue
}
