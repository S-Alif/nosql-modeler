/**
 * helpers that decide which options a field has and which are set.
 * options are stored on every field (`field.options`, see createFieldOptions),
 * but only the ones that fit the value type of the field are shown and exported.
 */
import {
    DEFAULT_TTL_UNIT,
    OPTION_CATEGORY_BY_VALUE_TYPE,
    OPTION_KEYS_BY_CATEGORY,
    TTL_UNITS
} from "../constants/field-options.js"
import { ARRAY_FIELD_TYPE } from "../constants/field-types.js"
import { createFieldOptions } from "../models/factories.js"

/**
 * gives the type of the values a field holds, the item type for arrays.
 * @param {import("../models/factories.js").Field} field any field
 * @returns {string}
 */
export function getFieldValueType(field) {
    return field.type === ARRAY_FIELD_TYPE ? field.itemType : field.type
}

/**
 * finds the option category of a field, which says which options fit it.
 * @param {import("../models/factories.js").Field} field any field
 * @returns {string | null} "text", "integer", "float", "date", or null when the field has no options
 */
export function getFieldOptionCategory(field) {
    if (field.isSystem) {
        return null
    }

    return OPTION_CATEGORY_BY_VALUE_TYPE[getFieldValueType(field)] ?? null
}

/**
 * lists the options that fit a field.
 * @param {import("../models/factories.js").Field} field any field
 * @returns {string[]} option keys, empty when the field has no options (objects, booleans, _id ...)
 */
export function getApplicableOptionKeys(field) {
    const category = getFieldOptionCategory(field)

    return category ? OPTION_KEYS_BY_CATEGORY[category] : []
}

/**
 * tells whether one option is set.
 * @param {import("../models/factories.js").FieldOptions} options options of a field
 * @param {string} optionKey key of the option
 * @returns {boolean}
 */
export function isOptionActive(options, optionKey) {
    const optionValue = options[optionKey]

    if (Array.isArray(optionValue)) {
        return optionValue.length > 0
    }

    return optionValue !== "" && optionValue !== false && optionValue !== undefined
}

/**
 * counts the options of a field that are set and fit its type.
 * @param {import("../models/factories.js").Field} field any field
 * @returns {number}
 */
export function countActiveOptions(field) {
    return getApplicableOptionKeys(field).filter((optionKey) =>
        isOptionActive(field.options, optionKey)
    ).length
}

/**
 * decides what happens to the options when a field changes type.
 * options are kept while the new type is in the same category (int to long, double to
 * decimal), otherwise they would no longer make sense and are reset.
 * @param {import("../models/factories.js").Field} field field before the change
 * @param {{ type?: string, itemType?: string }} changes the type changes about to be saved
 * @returns {import("../models/factories.js").FieldOptions} options to save with the type change
 */
export function getOptionsAfterTypeChange(field, changes) {
    const changedField = {
        ...field,
        ...changes
    }
    const categoryBefore = getFieldOptionCategory(field)
    const categoryAfter = getFieldOptionCategory(changedField)

    return categoryBefore !== null && categoryBefore === categoryAfter
        ? field.options
        : createFieldOptions()
}

/**
 * turns the ttl setting of a field into seconds, the value mongodb stores as expireAfterSeconds.
 * @param {import("../models/factories.js").Field} field any field
 * @returns {number | null} seconds, or null when the field has no ttl (not a date, or no value)
 */
export function getTtlSeconds(field) {
    if (!getApplicableOptionKeys(field).includes("ttlValue") || field.options.ttlValue === "") {
        return null
    }

    const unit = TTL_UNITS.find((candidate) => candidate.name === field.options.ttlUnit)
    const secondsPerUnit = unit
        ? unit.seconds
        : TTL_UNITS.find((candidate) => candidate.name === DEFAULT_TTL_UNIT).seconds

    return Number(field.options.ttlValue) * secondsPerUnit
}
