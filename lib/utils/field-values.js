/**
 * turns the text values stored on fields (default values, enum values, min and max) into
 * real values for the exporters. everything is stored as the text the user typed,
 * see docs/fields.md.
 */
import { raw } from "./code-writer.js"

/**
 * turns the default value text of a field into a value for generated code.
 * @param {import("../models/factories.js").Field} field field with a default value
 * @returns {any} a string, number, boolean or raw code, or undefined when the field has no default
 */
export function getDefaultValueForCode(field) {
    const defaultText = field.defaultValue.trim()

    if (defaultText.length === 0) {
        return undefined
    }

    switch (field.type) {
        case "int":
        case "long":
        case "double": {
            return Number(defaultText)
        }

        case "boolean": {
            return defaultText === "true"
        }

        case "date": {
            return defaultText === "now" ? raw("Date.now") : raw(`new Date(${JSON.stringify(defaultText)})`)
        }

        default: {
            return defaultText
        }
    }
}

/**
 * turns the enum values of a field into real values: numbers for number fields, text otherwise.
 * values that are not numbers are dropped for number fields.
 * @param {string[]} enumValues values as typed text
 * @param {boolean} isNumeric true when the field holds numbers
 * @returns {Array<string | number>}
 */
export function getEnumValuesForCode(enumValues, isNumeric) {
    if (!isNumeric) {
        return enumValues
    }

    return enumValues.map(Number).filter((numberValue) => Number.isFinite(numberValue))
}
