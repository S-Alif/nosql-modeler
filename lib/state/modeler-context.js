/**
 * react context that carries the modeler state and dispatch function.
 * the provider lives in components/providers/modeler-provider.jsx
 * and components read it through the useModeler hook.
 */
import { createContext } from "react"

export const ModelerContext = createContext(null)
