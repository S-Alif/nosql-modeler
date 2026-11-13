/**
 * label helper for field types.
 */
import { ARRAY_FIELD_TYPE } from "../constants/field-types.js"

/**
 * builds the type text shown next to a field name.
 * @param {import("../models/factories.js").Field} field field to describe
 * @returns {string} for example "string" or "array<objectId>"
 */
export function formatFieldType(field) {
    return field.type === ARRAY_FIELD_TYPE ? `array<${field.itemType}>` : field.type
}
