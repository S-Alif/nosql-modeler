/**
 * local storage persistence for the theme preference.
 * a storage failure (private mode, blocked storage) never throws, the app just
 * forgets the preference and starts on the default.
 */
import {
    DARK_THEME,
    DEFAULT_THEME_PREFERENCE,
    LIGHT_THEME,
    SYSTEM_THEME,
    THEME_STORAGE_KEY
} from "../constants/theme-config.js"

/**
 * higher order function that guards a storage operation.
 * on any error it logs the error and returns the fallback instead of throwing.
 * @param {Function} storageOperation operation that may throw
 * @param {any} fallbackValue value to return when the operation fails
 * @returns {Function} guarded version of the operation
 */
function withStorageFallback(storageOperation, fallbackValue) {
    return function guardedOperation(...operationArguments) {
        try {
            return storageOperation(...operationArguments)
        } catch (error) {
            console.error("theme storage error:", error)
            return fallbackValue
        }
    }
}

/**
 * loads the saved theme preference.
 * @returns {"system" | "light" | "dark"} the saved preference, or the default when none is saved or it is unknown
 */
export const loadThemePreference = withStorageFallback(function readPreference() {
    const savedPreference = globalThis.localStorage.getItem(THEME_STORAGE_KEY)
    const knownPreferences = [SYSTEM_THEME, LIGHT_THEME, DARK_THEME]

    return knownPreferences.includes(savedPreference) ? savedPreference : DEFAULT_THEME_PREFERENCE
}, DEFAULT_THEME_PREFERENCE)

/**
 * saves the theme preference.
 * @param {"system" | "light" | "dark"} preference preference to save
 */
export const saveThemePreference = withStorageFallback(function writePreference(preference) {
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, preference)
}, undefined)
