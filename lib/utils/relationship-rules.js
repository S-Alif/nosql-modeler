/**
 * rules that connect a relationship to the fields at its two ends.
 * all functions are pure, nothing here touches state.
 */
import { EMBED_RELATIONSHIP } from "../constants/relationship-types.js"
import { getFieldValueType } from "./field-options.js"
import { hasChildFields } from "./field-tree.js"

/**
 * picks the field a new reference points at by default: the _id of the collection.
 * @param {import("../models/factories.js").Collection} collection target collection
 * @returns {import("../models/factories.js").Field | null} the _id field, or the first field when there is none
 */
export function getDefaultTargetField(collection) {
    return collection.fields.find((field) => field.isSystem) ?? collection.fields[0] ?? null
}

/**
 * checks that the two fields of a relationship still fit together.
 * the user can change a field type by hand, so this only warns, it never blocks.
 * @param {import("../models/factories.js").Relationship} relationship relationship to check
 * @param {import("../models/factories.js").Field} sourceField field that holds the link
 * @param {import("../models/factories.js").Field | null} targetField field that is referenced, null for an embed
 * @returns {string | null} warning text, or null when the fields fit
 */
export function getRelationshipWarning(relationship, sourceField, targetField) {
    if (relationship.type === EMBED_RELATIONSHIP) {
        return hasChildFields(sourceField)
            ? null
            : "an embedded field should be an object or an array of objects"
    }

    if (!targetField) {
        return "pick the field this one points at"
    }

    const sourceValueType = getFieldValueType(sourceField)
    const targetValueType = getFieldValueType(targetField)

    if (sourceValueType !== targetValueType) {
        return `${sourceField.name} holds ${sourceValueType} but ${targetField.name} is ${targetValueType}`
    }

    return null
}
