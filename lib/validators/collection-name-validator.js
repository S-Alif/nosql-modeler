/**
 * validation for collection names, following the mongodb naming rules
 * and conventions (see lib/constants/naming-rules.js).
 */
import {
    COLLECTION_NAME_MAX_LENGTH,
    COLLECTION_NAME_START_PATTERN
} from "../constants/naming-rules.js"
import { validateNameCharacters } from "./name-characters-validator.js"

/**
 * validates a collection name typed by the user.
 * @param {string} name name to check
 * @param {string[]} otherCollectionNames names of all other collections
 * @returns {string | null} error message, or null when the name is valid
 */
export function validateCollectionName(name, otherCollectionNames) {
    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
        return "name is required"
    }

    if (trimmedName.length > COLLECTION_NAME_MAX_LENGTH) {
        return `name must be at most ${COLLECTION_NAME_MAX_LENGTH} characters`
    }

    const characterError = validateNameCharacters(trimmedName)

    if (characterError) {
        return characterError
    }

    if (!COLLECTION_NAME_START_PATTERN.test(trimmedName)) {
        return "name must start with a letter"
    }

    if (otherCollectionNames.includes(trimmedName)) {
        return "a collection with this name already exists"
    }

    return null
}
