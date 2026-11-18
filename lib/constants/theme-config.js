/**
 * constants for the theme switcher.
 * the preference is "system" (follow the operating system), "light" or "dark".
 */

// local storage key that holds the theme preference
// (index.html reads the same key before the page paints, keep both in step)
const THEME_STORAGE_KEY = "mongo-modeler:theme"

// the three preferences
const SYSTEM_THEME = "system"
const LIGHT_THEME = "light"
const DARK_THEME = "dark"

// the preference used until the user picks one
const DEFAULT_THEME_PREFERENCE = SYSTEM_THEME

// the switcher buttons in order, with the label and the tooltip of each
const THEME_OPTIONS = [
    {
        value: LIGHT_THEME,
        label: "Light",
        title: "light theme"
    },
    {
        value: SYSTEM_THEME,
        label: "Auto",
        title: "follow the system setting"
    },
    {
        value: DARK_THEME,
        label: "Dark",
        title: "dark theme"
    }
]

export {
    THEME_STORAGE_KEY,
    SYSTEM_THEME,
    LIGHT_THEME,
    DARK_THEME,
    DEFAULT_THEME_PREFERENCE,
    THEME_OPTIONS
}
