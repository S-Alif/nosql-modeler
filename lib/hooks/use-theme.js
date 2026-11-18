/**
 * hook for reading and changing the theme from any component.
 */
import { useContext } from "react"
import { ThemeContext } from "../state/theme-context.js"

/**
 * returns the theme preference and the function that changes it.
 * must be called inside <ThemeProvider>.
 * @returns {{ themePreference: "system" | "light" | "dark", setThemePreference: Function }}
 */
export function useTheme() {
    const themeContextValue = useContext(ThemeContext)

    if (!themeContextValue) {
        throw new Error("useTheme must be used inside ThemeProvider")
    }

    return themeContextValue
}
