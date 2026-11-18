/**
 * provider component that owns the theme preference.
 * it writes the preference to the <html> element as data-theme ("light" or "dark",
 * removed for "system" so the operating system decides) and saves it to local storage.
 * the css in styles/global.css reacts to data-theme, see docs/theme.md.
 */
import {
    useEffect,
    useMemo,
    useState
} from "react"
import {
    SYSTEM_THEME,
    THEME_STORAGE_KEY
} from "../../lib/constants/theme-config.js"
import { ThemeContext } from "../../lib/state/theme-context.js"
import {
    loadThemePreference,
    saveThemePreference
} from "../../lib/storage/theme-storage.js"

/**
 * wraps the app and shares the theme through ThemeContext.
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
function ThemeProvider({ children }) {
    const [themePreference, setThemePreference] = useState(loadThemePreference)

    // apply the preference to the page and remember it
    useEffect(() => {
        const rootElement = document.documentElement

        if (themePreference === SYSTEM_THEME) {
            delete rootElement.dataset.theme
        } else {
            rootElement.dataset.theme = themePreference
        }

        saveThemePreference(themePreference)
    }, [themePreference])

    // keep several open tabs in step
    useEffect(() => {
        /** takes over a preference changed in another tab */
        function handleStorageChange(event) {
            if (event.key === THEME_STORAGE_KEY) {
                setThemePreference(loadThemePreference())
            }
        }

        window.addEventListener("storage", handleStorageChange)

        return () => window.removeEventListener("storage", handleStorageChange)
    }, [])

    const contextValue = useMemo(
        () => ({
            themePreference,
            setThemePreference
        }),
        [themePreference]
    )

    return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
