/**
 * rules that connect a relationship to the fields at its two ends.
 * all functions are pure, nothing here touches state.
 */
import { ARRAY_FIELD_TYPE } from "../constants/field-types.js"
import {
    CARDINALITY_MANY,
    CARDINALITY_ONE,
    EMBED_RELATIONSHIP
} from "../constants/relationship-types.js"
import { hasChildFields } from "./field-tree.js"

/**
 * tells whether a field holds one value or many.
 * @param {import("../models/factories.js").Field} field source field of a relationship
 * @returns {"one" | "many"} many for array fields, one for everything else
 */
export function getFieldCardinality(field) {
    return field.type === ARRAY_FIELD_TYPE ? CARDINALITY_MANY : CARDINALITY_ONE
}

/**
 * gives the type of the values a field holds, the item type for arrays.
 * @param {import("../models/factories.js").Field} field any field
 * @returns {string}
 */
export function getFieldValueType(field) {
    return field.type === ARRAY_FIELD_TYPE ? field.itemType : field.type
}

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

/**
 * works out the cardinality marks drawn at the two ends of an edge.
 * a reference: many documents can hold the same value, so the source end is "N", and the
 * target end is "1" for a single value or "N" when the source field is an array.
 * an embed: one parent document, so the source end is "1", and the target end is "N" for an array.
 * @param {import("../models/factories.js").Relationship} relationship relationship to draw
 * @param {import("../models/factories.js").Field} sourceField field that holds the link
 * @returns {{ source: string, target: string }}
 */
export function getEdgeBadges(relationship, sourceField) {
    const isMany = getFieldCardinality(sourceField) === CARDINALITY_MANY
    const targetBadge = isMany ? "N" : "1"

    if (relationship.type === EMBED_RELATIONSHIP) {
        return {
            source: "1",
            target: targetBadge
        }
    }

    return {
        source: "N",
        target: targetBadge
    }
}
