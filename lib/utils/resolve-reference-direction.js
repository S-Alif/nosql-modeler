/**
 * decides which way a reference drawn between two fields points.
 * the user can drag from either field, so the direction comes from the fields:
 * an _id field is what gets referenced, it can never hold a reference, so the other
 * field is the source. when neither is an _id the drag direction decides, and when that
 * field already backs another relationship the other direction is tried.
 */
import { findFieldById } from "./field-tree.js"

/**
 * finds one end of a connection.
 * @param {import("../models/factories.js").Project} project current project
 * @param {{ collectionId: string, fieldId: string | null }} connectionEnd collection and field id
 * @returns {import("../models/factories.js").Field | null}
 */
function findConnectionField(project, connectionEnd) {
    const collection = project.collections.find(
        (candidate) => candidate.id === connectionEnd.collectionId
    )

    if (!collection || !connectionEnd.fieldId) {
        return null
    }

    return findFieldById(collection.fields, connectionEnd.fieldId)
}

/**
 * works out source and target for a reference between two fields.
 * @param {import("../models/factories.js").Project} project current project
 * @param {{ collectionId: string, fieldId: string | null }} firstEnd where the drag started
 * @param {{ collectionId: string, fieldId: string | null }} secondEnd where the drag ended
 * @returns {{ sourceCollectionId: string, sourceFieldId: string, targetCollectionId: string, targetFieldId: string } | null}
 *   the relationship ends, or null when the two fields cannot be connected
 */
export function resolveReferenceDirection(project, firstEnd, secondEnd) {
    const firstField = findConnectionField(project, firstEnd)
    const secondField = findConnectionField(project, secondEnd)

    if (!firstField || !secondField || firstField.id === secondField.id) {
        return null
    }

    // two _id fields cannot reference each other
    if (firstField.isSystem && secondField.isSystem) {
        return null
    }

    // the possible directions, the first one that works is used
    let candidates = [
        [firstEnd, secondEnd],
        [secondEnd, firstEnd]
    ]

    if (secondField.isSystem) {
        candidates = [[firstEnd, secondEnd]]
    } else if (firstField.isSystem) {
        candidates = [[secondEnd, firstEnd]]
    }

    // one field can back only one relationship
    const usableCandidate = candidates.find(
        ([sourceEnd]) =>
            !project.relationships.some(
                (relationship) => relationship.sourceFieldId === sourceEnd.fieldId
            )
    )

    if (!usableCandidate) {
        return null
    }

    const [sourceEnd, targetEnd] = usableCandidate

    return {
        sourceCollectionId: sourceEnd.collectionId,
        sourceFieldId: sourceEnd.fieldId,
        targetCollectionId: targetEnd.collectionId,
        targetFieldId: targetEnd.fieldId
    }
}
