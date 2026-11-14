/**
 * character check shared by the collection and field name validators.
 */
import { ALLOWED_NAME_CHARACTERS_PATTERN } from "../constants/naming-rules.js"

/**
 * checks which characters a name uses and explains the first problem it finds.
 * @param {string} trimmedName name without leading and trailing spaces
 * @returns {string | null} error message, or null when every character is allowed
 */
export function validateNameCharacters(trimmedName) {
    if (/\s/.test(trimmedName)) {
        return "name cannot contain spaces, use snake_case or camelCase"
    }

    if (trimmedName.includes("-")) {
        return "name cannot contain hyphens, use underscores instead"
    }

    if (trimmedName.includes(".")) {
        return "name cannot contain a dot"
    }

    if (trimmedName.includes("$")) {
        return "name cannot contain $"
    }

    if (!ALLOWED_NAME_CHARACTERS_PATTERN.test(trimmedName)) {
        return "name can only contain letters, numbers and underscores"
    }

    return null
}
