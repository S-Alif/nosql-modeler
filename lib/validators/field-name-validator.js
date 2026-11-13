/**
 * validation for field names, following the mongodb naming rules.
 */

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

    if (trimmedName.includes(".")) {
        return "name cannot contain a dot"
    }

    if (trimmedName.startsWith("$")) {
        return "name cannot start with $"
    }

    if (trimmedName.includes("\u0000")) {
        return "name cannot contain a null character"
    }

    if (siblingNames.includes(trimmedName)) {
        return "another field here already has this name"
    }

    return null
}
