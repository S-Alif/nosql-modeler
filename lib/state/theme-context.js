/**
 * react context that carries the theme preference and the function that changes it.
 * the provider lives in components/providers/theme-provider.jsx
 * and components read it through the useTheme hook.
 */
import { createContext } from "react"

export const ThemeContext = createContext(null)
