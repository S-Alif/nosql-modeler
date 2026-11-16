/**
 * validation for field options.
 * option values are stored as the text the user typed (like default values) and are
 * checked here, an empty text always means "not set".
 */
import {
    DATE_OPTION_CATEGORY,
    INTEGER_OPTION_CATEGORY,
    MAX_TTL_SECONDS,
    TEXT_OPTION_CATEGORY,
    TTL_UNITS
} from "../constants/field-options.js"
import { ARRAY_FIELD_TYPE } from "../constants/field-types.js"
import { getFieldOptionCategory } from "../utils/field-options.js"

// whole number without a sign
const COUNT_PATTERN = /^\d+$/

// number with an optional sign and fraction
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/

// whole number with an optional sign
const INTEGER_PATTERN = /^-?\d+$/

/**
 * checks that a text is a number the category accepts.
 * @param {string} category option category of the field
 * @param {string} text trimmed text
 * @returns {string | null} error message, or null when the text is fine
 */
function validateNumberText(category, text) {
    if (category === INTEGER_OPTION_CATEGORY) {
        return INTEGER_PATTERN.test(text) ? null : "must be a whole number"
    }

    return NUMBER_PATTERN.test(text) ? null : "must be a number"
}

/**
 * checks that a text can be used as a min or max.
 * @param {string} category option category of the field
 * @param {string} text trimmed text
 * @returns {string | null} error message, or null when the text is fine
 */
function validateBoundText(category, text) {
    if (category === DATE_OPTION_CATEGORY) {
        return Number.isNaN(Date.parse(text)) ? "must be a date like 2025-01-31" : null
    }

    return validateNumberText(category, text)
}

/**
 * turns a bound text into something comparable.
 * @param {string} category option category of the field
 * @param {string} text valid bound text
 * @returns {number}
 */
function toComparableBound(category, text) {
    return category === DATE_OPTION_CATEGORY ? Date.parse(text) : Number(text)
}

/**
 * validates one value of the enum list.
 * @param {import("../models/factories.js").Field} field field that owns the enum
 * @param {string} valueText the value typed by the user
 * @param {string[]} existingValues values already in the list
 * @returns {string | null} error message, or null when the value can be added
 */
export function validateEnumValue(field, valueText, existingValues) {
    const trimmedText = valueText.trim()
    const category = getFieldOptionCategory(field)

    if (trimmedText.length === 0) {
        return "type a value"
    }

    if (category !== TEXT_OPTION_CATEGORY) {
        const numberError = validateNumberText(category, trimmedText)

        if (numberError) {
            return numberError
        }
    }

    const isDuplicate = existingValues.some((existingValue) =>
        category === TEXT_OPTION_CATEGORY
            ? existingValue === trimmedText
            : Number(existingValue) === Number(trimmedText)
    )

    return isDuplicate ? "already in the list" : null
}

/**
 * validates the text of one option input.
 * @param {import("../models/factories.js").Field} field field that owns the option
 * @param {string} optionKey "minLength", "maxLength", "min", "max", "match" or "ttlValue"
 * @param {string} optionText text typed by the user
 * @returns {string | null} error message, or null when the text is valid (empty is valid, it means not set)
 */
export function validateOption(field, optionKey, optionText) {
    const trimmedText = optionText.trim()
    const category = getFieldOptionCategory(field)
    const options = field.options

    if (trimmedText.length === 0) {
        return null
    }

    switch (optionKey) {
        case "minLength":
        case "maxLength": {
            if (!COUNT_PATTERN.test(trimmedText)) {
                return "must be a whole number, 0 or more"
            }

            const otherText = optionKey === "minLength" ? options.maxLength : options.minLength

            if (otherText !== "") {
                const minimum = optionKey === "minLength" ? Number(trimmedText) : Number(otherText)
                const maximum = optionKey === "minLength" ? Number(otherText) : Number(trimmedText)

                if (minimum > maximum) {
                    return "min length is bigger than max length"
                }
            }

            return null
        }

        case "min":
        case "max": {
            const boundError = validateBoundText(category, trimmedText)

            if (boundError) {
                return boundError
            }

            const otherText = optionKey === "min" ? options.max : options.min

            if (otherText !== "" && validateBoundText(category, otherText) === null) {
                const minimum = toComparableBound(category, optionKey === "min" ? trimmedText : otherText)
                const maximum = toComparableBound(category, optionKey === "min" ? otherText : trimmedText)

                if (minimum > maximum) {
                    return "min is bigger than max"
                }
            }

            return null
        }

        case "match": {
            try {
                new RegExp(trimmedText)
            } catch {
                return "not a valid regular expression"
            }

            return null
        }

        case "ttlValue": {
            if (!COUNT_PATTERN.test(trimmedText)) {
                return "must be a whole number, 0 or more"
            }

            const unit = TTL_UNITS.find((candidate) => candidate.name === options.ttlUnit)

            if (Number(trimmedText) * (unit?.seconds ?? 1) > MAX_TTL_SECONDS) {
                return "too long, the limit is about 68 years"
            }

            return null
        }

        default: {
            return null
        }
    }
}

/**
 * finds a default value that breaks the options of its own field.
 * only a warning, the field can still be saved.
 * @param {import("../models/factories.js").Field} field field to check
 * @returns {string | null} warning text, or null when the default fits (or there is none)
 */
export function getDefaultValueConflict(field) {
    const defaultText = field.defaultValue

    if (!defaultText || field.type === ARRAY_FIELD_TYPE) {
        return null
    }

    const category = getFieldOptionCategory(field)
    const options = field.options

    if (category === TEXT_OPTION_CATEGORY) {
        if (options.enumValues.length > 0 && !options.enumValues.includes(defaultText)) {
            return "the default value is not in the enum list"
        }

        if (options.minLength !== "" && defaultText.length < Number(options.minLength)) {
            return "the default value is shorter than the min length"
        }

        if (options.maxLength !== "" && defaultText.length > Number(options.maxLength)) {
            return "the default value is longer than the max length"
        }

        if (options.match !== "" && validateOption(field, "match", options.match) === null) {
            return new RegExp(options.match).test(defaultText)
                ? null
                : "the default value does not match the pattern"
        }

        return null
    }

    if (category === DATE_OPTION_CATEGORY) {
        // "now" is worked out when the document is created, so it cannot be compared
        if (defaultText === "now" || Number.isNaN(Date.parse(defaultText))) {
            return null
        }

        const defaultTime = Date.parse(defaultText)

        if (options.min !== "" && defaultTime < Date.parse(options.min)) {
            return "the default value is before the min date"
        }

        if (options.max !== "" && defaultTime > Date.parse(options.max)) {
            return "the default value is after the max date"
        }

        return null
    }

    if (category === null || Number.isNaN(Number(defaultText))) {
        return null
    }

    const defaultNumber = Number(defaultText)

    if (
        options.enumValues.length > 0 &&
        !options.enumValues.some((enumValue) => Number(enumValue) === defaultNumber)
    ) {
        return "the default value is not in the enum list"
    }

    if (options.min !== "" && defaultNumber < Number(options.min)) {
        return "the default value is below the min"
    }

    if (options.max !== "" && defaultNumber > Number(options.max)) {
        return "the default value is above the max"
    }

    return null
}
