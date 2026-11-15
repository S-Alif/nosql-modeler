/**
 * project level operations for relationships.
 * a relationship connects two existing fields, nothing here creates or changes a field,
 * the user creates the fields first and then connects them.
 * each function takes a project and returns a new one, or returns the very same
 * project object when the change is not allowed, so callers can detect "nothing happened".
 */
import {
    EMBED_RELATIONSHIP,
    REFERENCE_RELATIONSHIP,
    RELATIONSHIP_TYPES
} from "../constants/relationship-types.js"
import { createRelationship } from "../models/factories.js"
import { findFieldById } from "./field-tree.js"
import { pruneOrphanRelationships } from "./prune-relationships.js"
import { getDefaultTargetField } from "./relationship-rules.js"

/**
 * finds a collection by id.
 * @param {import("../models/factories.js").Project} project project to search
 * @param {string} collectionId id of the collection
 * @returns {import("../models/factories.js").Collection | undefined}
 */
function findCollection(project, collectionId) {
    return project.collections.find((collection) => collection.id === collectionId)
}

/**
 * checks that a relationship can exist in a project.
 * rules: the type is known, the source field exists and is not an _id, one field backs only
 * one relationship, a reference points at an existing field other than the source,
 * an embed has no target field and cannot embed a collection in itself.
 * @param {import("../models/factories.js").Project} project project to check against
 * @param {import("../models/factories.js").Relationship} relationship candidate relationship
 * @returns {boolean}
 */
function isRelationshipAllowed(project, relationship) {
    const sourceCollection = findCollection(project, relationship.sourceCollectionId)
    const targetCollection = findCollection(project, relationship.targetCollectionId)

    if (!sourceCollection || !targetCollection || !RELATIONSHIP_TYPES.includes(relationship.type)) {
        return false
    }

    const sourceField = findFieldById(sourceCollection.fields, relationship.sourceFieldId)

    if (!sourceField || sourceField.isSystem) {
        return false
    }

    const isFieldTaken = project.relationships.some(
        (item) => item.id !== relationship.id && item.sourceFieldId === relationship.sourceFieldId
    )

    if (isFieldTaken) {
        return false
    }

    if (relationship.type === EMBED_RELATIONSHIP) {
        return sourceCollection.id !== targetCollection.id && relationship.targetFieldId === null
    }

    const targetField = relationship.targetFieldId
        ? findFieldById(targetCollection.fields, relationship.targetFieldId)
        : null

    return Boolean(targetField) && targetField.id !== sourceField.id
}

/**
 * adds a relationship between two existing fields.
 * @param {import("../models/factories.js").Project} project current project
 * @param {Object} relationshipDetails the link to add
 * @param {string} [relationshipDetails.type] "reference" (default) or "embed"
 * @param {string} relationshipDetails.sourceCollectionId collection that holds the link
 * @param {string} relationshipDetails.sourceFieldId field that holds the link
 * @param {string} relationshipDetails.targetCollectionId collection that is pointed at
 * @param {string | null} [relationshipDetails.targetFieldId] field that is pointed at, ignored for an embed
 * @returns {import("../models/factories.js").Project} new project, or the same project when the link is not allowed
 */
export function addRelationshipToProject(project, relationshipDetails) {
    const type = relationshipDetails.type ?? REFERENCE_RELATIONSHIP
    const candidate = createRelationship({
        type,
        sourceCollectionId: relationshipDetails.sourceCollectionId,
        sourceFieldId: relationshipDetails.sourceFieldId,
        targetCollectionId: relationshipDetails.targetCollectionId,
        targetFieldId: type === EMBED_RELATIONSHIP ? null : (relationshipDetails.targetFieldId ?? null)
    })

    if (!isRelationshipAllowed(project, candidate)) {
        return project
    }

    return {
        ...project,
        relationships: [...project.relationships, candidate]
    }
}

/**
 * changes a relationship.
 * allowed changes: type, sourceFieldId, targetCollectionId and targetFieldId.
 * when the target collection changes (or the type becomes "reference") and no target field
 * is given, the _id of the target collection is used. an embed never has a target field.
 * the fields themselves are never changed, the ui shows a warning when they do not fit.
 * @param {import("../models/factories.js").Project} project current project
 * @param {string} relationshipId relationship to change
 * @param {{ type?: string, sourceFieldId?: string, targetCollectionId?: string, targetFieldId?: string | null }} changes requested changes
 * @returns {import("../models/factories.js").Project} new project, or the same project when the change is not allowed
 */
export function updateRelationshipInProject(project, relationshipId, changes) {
    const relationship = project.relationships.find((item) => item.id === relationshipId)

    if (!relationship) {
        return project
    }

    const nextType = changes.type ?? relationship.type
    const nextTargetCollectionId = changes.targetCollectionId ?? relationship.targetCollectionId
    const nextTargetCollection = findCollection(project, nextTargetCollectionId)

    if (!nextTargetCollection) {
        return project
    }

    // pick the target field: an explicit choice, the old one while the target stays, else the _id
    let nextTargetFieldId = null

    if (nextType === REFERENCE_RELATIONSHIP) {
        const keepsTarget =
            changes.targetFieldId === undefined &&
            nextTargetCollectionId === relationship.targetCollectionId &&
            relationship.targetFieldId

        nextTargetFieldId = changes.targetFieldId
            ?? (keepsTarget ? relationship.targetFieldId : getDefaultTargetField(nextTargetCollection)?.id ?? null)
    }

    const updatedRelationship = {
        ...relationship,
        type: nextType,
        sourceFieldId: changes.sourceFieldId ?? relationship.sourceFieldId,
        targetCollectionId: nextTargetCollectionId,
        targetFieldId: nextTargetFieldId
    }

    if (!isRelationshipAllowed(project, updatedRelationship)) {
        return project
    }

    return pruneOrphanRelationships({
        ...project,
        relationships: project.relationships.map((item) =>
            item.id === relationship.id ? updatedRelationship : item
        )
    })
}
