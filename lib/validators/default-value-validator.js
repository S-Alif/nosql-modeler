/**
 * validation for default values.
 * default values are stored as the text the user typed, and checked against
 * the field type here. an empty text always means "no default".
 */

// whole number, optional minus sign
const INTEGER_PATTERN = /^-?\d+$/

// decimal number with an optional fraction, optional minus sign
const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/

// range of a 32 bit integer
const INT_MIN_VALUE = -2147483648
const INT_MAX_VALUE = 2147483647

/**
 * validates the default value text for a field type.
 * @param {string} fieldType type of the field
 * @param {string} defaultValueText text typed by the user
 * @returns {string | null} error message, or null when the text is valid
 */
export function validateDefaultValue(fieldType, defaultValueText) {
    const trimmedText = defaultValueText.trim()

    if (trimmedText.length === 0) {
        return null
    }

    switch (fieldType) {
        case "string": {
            return null
        }

        case "int": {
            if (!INTEGER_PATTERN.test(trimmedText)) {
                return "must be a whole number"
            }

            const numberValue = Number(trimmedText)

            if (numberValue < INT_MIN_VALUE || numberValue > INT_MAX_VALUE) {
                return "must fit in 32 bits, use long for bigger numbers"
            }

            return null
        }

        case "long": {
            if (!INTEGER_PATTERN.test(trimmedText) || !Number.isSafeInteger(Number(trimmedText))) {
                return "must be a whole number up to 9007199254740991"
            }

            return null
        }

        case "double": {
            return Number.isFinite(Number(trimmedText)) ? null : "must be a number"
        }

        case "decimal": {
            return DECIMAL_PATTERN.test(trimmedText) ? null : "must be a decimal number"
        }

        case "boolean": {
            return trimmedText === "true" || trimmedText === "false"
                ? null
                : "must be true or false"
        }

        case "date": {
            const isNow = trimmedText === "now"
            const isDateText = !Number.isNaN(Date.parse(trimmedText))

            return isNow || isDateText ? null : "must be \"now\" or a valid date"
        }

        default: {
            return "default values are not supported for this type"
        }
    }
}
