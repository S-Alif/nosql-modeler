/**
 * validation for collection names, following the mongodb naming rules.
 */

// longest collection name the ui accepts
const MAX_COLLECTION_NAME_LENGTH = 120

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

    if (trimmedName.length > MAX_COLLECTION_NAME_LENGTH) {
        return `name must be at most ${MAX_COLLECTION_NAME_LENGTH} characters`
    }

    if (trimmedName.includes("$")) {
        return "name cannot contain $"
    }

    if (trimmedName.includes("\u0000")) {
        return "name cannot contain a null character"
    }

    if (trimmedName.startsWith("system.")) {
        return "name cannot start with system."
    }

    if (otherCollectionNames.includes(trimmedName)) {
        return "a collection with this name already exists"
    }

    return null
}
