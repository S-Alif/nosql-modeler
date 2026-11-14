/**
 * rules that connect a relationship to the field that backs it.
 * all functions are pure, nothing here touches state.
 */
import { ARRAY_FIELD_TYPE, ID_FIELD_TYPE, OBJECT_FIELD_TYPE } from "../constants/field-types.js"
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
 * finds the type a reference field must have to match the target collection.
 * @param {import("../models/factories.js").Collection} targetCollection collection that is referenced
 * @returns {string} type of the target's _id field
 */
export function getTargetIdType(targetCollection) {
    const idField = targetCollection.fields.find((field) => field.isSystem)

    return idField ? idField.type : ID_FIELD_TYPE
}

/**
 * builds the field type a relationship needs.
 * a reference holds the target _id type, an embed holds an object, and "many" wraps either in an array.
 * @param {string} relationshipType "reference" or "embed"
 * @param {"one" | "many"} cardinality how many values the field holds
 * @param {string} targetIdType type of the target's _id field
 * @returns {{ type: string, itemType?: string }} field properties to apply
 */
export function getRelationshipFieldShape(relationshipType, cardinality, targetIdType) {
    const valueType = relationshipType === EMBED_RELATIONSHIP ? OBJECT_FIELD_TYPE : targetIdType

    if (cardinality === CARDINALITY_MANY) {
        return {
            type: ARRAY_FIELD_TYPE,
            itemType: valueType
        }
    }

    return { type: valueType }
}

/**
 * checks that the source field still fits its relationship.
 * the user can change a field type by hand, so this only warns, it never blocks.
 * @param {import("../models/factories.js").Relationship} relationship relationship to check
 * @param {import("../models/factories.js").Field} sourceField field that backs the relationship
 * @param {import("../models/factories.js").Collection} targetCollection target of the relationship
 * @returns {string | null} warning text, or null when the field fits
 */
export function getRelationshipWarning(relationship, sourceField, targetCollection) {
    if (relationship.type === EMBED_RELATIONSHIP) {
        return hasChildFields(sourceField)
            ? null
            : "an embedded field should be an object or an array of objects"
    }

    const valueType = sourceField.type === ARRAY_FIELD_TYPE ? sourceField.itemType : sourceField.type
    const expectedType = getTargetIdType(targetCollection)

    if (valueType !== expectedType) {
        return `a reference to ${targetCollection.name} should be ${expectedType} or array<${expectedType}>`
    }

    return null
}
