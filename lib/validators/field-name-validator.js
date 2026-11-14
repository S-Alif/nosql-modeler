/**
 * validation for field names, following the mongodb naming rules
 * and conventions (see lib/constants/naming-rules.js).
 */
import {
    FIELD_NAME_MAX_LENGTH,
    FIELD_NAME_START_PATTERN
} from "../constants/naming-rules.js"
import { validateNameCharacters } from "./name-characters-validator.js"

/**
 * validates a field name typed by the user.
 * @param {string} name name to check
 * @param {string[]} siblingNames names of the other fields at the same level
 * @returns {string | null} error message, or null when the name is valid
 */
export function validateFieldName(name, siblingNames) {
    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
        return "name is required"
    }

    if (trimmedName.length > FIELD_NAME_MAX_LENGTH) {
        return `name must be at most ${FIELD_NAME_MAX_LENGTH} characters`
    }

    const characterError = validateNameCharacters(trimmedName)

    if (characterError) {
        return characterError
    }

    if (!FIELD_NAME_START_PATTERN.test(trimmedName)) {
        return "name must start with a letter or an underscore"
    }

    if (siblingNames.includes(trimmedName)) {
        return "another field here already has this name"
    }

    return null
}
