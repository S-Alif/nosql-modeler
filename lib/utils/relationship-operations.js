/**
 * project level operations for relationships.
 * each function takes a project and returns a new one, or returns the very same
 * project object when the change is not allowed, so callers can detect "nothing happened".
 */
import {
    CARDINALITY_ONE,
    REFERENCE_RELATIONSHIP,
    RELATIONSHIP_TYPES
} from "../constants/relationship-types.js"
import { createField, createRelationship } from "../models/factories.js"
import { findFieldById, updateFieldInTree } from "./field-tree.js"
import { pruneOrphanRelationships } from "./prune-relationships.js"
import { buildRelationshipFieldName } from "./relationship-naming.js"
import {
    getFieldCardinality,
    getRelationshipFieldShape,
    getTargetIdType
} from "./relationship-rules.js"

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
 * adds a relationship together with the field that backs it.
 * the field is created at the end of the source collection, named after the
 * target (for example "userId") and typed to fit (objectId or object).
 * @param {import("../models/factories.js").Project} project current project
 * @param {string} sourceCollectionId collection that gets the new field
 * @param {string} targetCollectionId collection that is referenced or embedded
 * @param {string} [relationshipType] "reference" (default) or "embed"
 * @returns {import("../models/factories.js").Project} new project, or the same project when the ids are invalid or equal
 */
export function addRelationshipToProject(
    project,
    sourceCollectionId,
    targetCollectionId,
    relationshipType = REFERENCE_RELATIONSHIP
) {
    const sourceCollection = findCollection(project, sourceCollectionId)
    const targetCollection = findCollection(project, targetCollectionId)

    if (
        !sourceCollection ||
        !targetCollection ||
        sourceCollection.id === targetCollection.id ||
        !RELATIONSHIP_TYPES.includes(relationshipType)
    ) {
        return project
    }

    const fieldName = buildRelationshipFieldName(
        relationshipType,
        targetCollection.name,
        sourceCollection.fields.map((field) => field.name)
    )
    const fieldShape = getRelationshipFieldShape(
        relationshipType,
        CARDINALITY_ONE,
        getTargetIdType(targetCollection)
    )
    const sourceField = createField(fieldName, fieldShape.type)
    const newRelationship = createRelationship({
        type: relationshipType,
        sourceCollectionId: sourceCollection.id,
        sourceFieldId: sourceField.id,
        targetCollectionId: targetCollection.id
    })

    return {
        ...project,
        collections: project.collections.map((collection) =>
            collection.id === sourceCollection.id
                ? {
                    ...collection,
                    fields: [...collection.fields, sourceField]
                }
                : collection
        ),
        relationships: [...project.relationships, newRelationship]
    }
}

/**
 * changes a relationship.
 * allowed changes: type, sourceFieldId, targetCollectionId, and cardinality ("one" or "many").
 * cardinality is not stored, it reshapes the source field into a single value or an array.
 * changing the type, the target or the cardinality also reshapes the source field to fit,
 * and renames it when it still has the automatic name. picking a different existing source
 * field never reshapes it, the ui shows a warning when it does not fit.
 * @param {import("../models/factories.js").Project} project current project
 * @param {string} relationshipId relationship to change
 * @param {{ type?: string, sourceFieldId?: string, targetCollectionId?: string, cardinality?: string }} changes requested changes
 * @returns {import("../models/factories.js").Project} new project, or the same project when the change is not allowed
 */
export function updateRelationshipInProject(project, relationshipId, changes) {
    const relationship = project.relationships.find((item) => item.id === relationshipId)

    if (!relationship) {
        return project
    }

    const sourceCollection = findCollection(project, relationship.sourceCollectionId)
    const previousTargetCollection = findCollection(project, relationship.targetCollectionId)
    const nextTargetCollection = findCollection(
        project,
        changes.targetCollectionId ?? relationship.targetCollectionId
    )
    const nextType = changes.type ?? relationship.type
    const nextSourceFieldId = changes.sourceFieldId ?? relationship.sourceFieldId
    const nextSourceField = sourceCollection
        ? findFieldById(sourceCollection.fields, nextSourceFieldId)
        : null

    const isChangeAllowed =
        Boolean(sourceCollection) &&
        Boolean(nextTargetCollection) &&
        nextTargetCollection.id !== sourceCollection.id &&
        RELATIONSHIP_TYPES.includes(nextType) &&
        Boolean(nextSourceField) &&
        !nextSourceField.isSystem

    // one field can back only one relationship
    const isFieldTaken = project.relationships.some(
        (item) => item.id !== relationship.id && item.sourceFieldId === nextSourceFieldId
    )

    if (!isChangeAllowed || isFieldTaken) {
        return project
    }

    const hasTypeChanged = nextType !== relationship.type
    const hasTargetChanged = nextTargetCollection.id !== relationship.targetCollectionId
    const hasCardinalityRequest = changes.cardinality !== undefined
    const isSameSourceField = nextSourceFieldId === relationship.sourceFieldId
    const needsFieldUpdate =
        isSameSourceField && (hasTypeChanged || hasTargetChanged || hasCardinalityRequest)

    let nextFields = sourceCollection.fields

    if (needsFieldUpdate) {
        const cardinality = changes.cardinality ?? getFieldCardinality(nextSourceField)
        let fieldChanges = getRelationshipFieldShape(
            nextType,
            cardinality,
            getTargetIdType(nextTargetCollection)
        )

        // an automatic name follows the new type and target, a name the user chose is kept
        const isTopLevelField = sourceCollection.fields.some((field) => field.id === nextSourceField.id)

        if (isTopLevelField && (hasTypeChanged || hasTargetChanged)) {
            const siblingNames = sourceCollection.fields
                .filter((field) => field.id !== nextSourceField.id)
                .map((field) => field.name)
            const previousAutoName = buildRelationshipFieldName(
                relationship.type,
                previousTargetCollection.name,
                siblingNames
            )

            if (nextSourceField.name === previousAutoName) {
                fieldChanges = {
                    ...fieldChanges,
                    name: buildRelationshipFieldName(
                        nextType,
                        nextTargetCollection.name,
                        siblingNames
                    )
                }
            }
        }

        nextFields = updateFieldInTree(nextFields, nextSourceField.id, fieldChanges)
    }

    const updatedRelationship = {
        ...relationship,
        type: nextType,
        sourceFieldId: nextSourceFieldId,
        targetCollectionId: nextTargetCollection.id
    }

    // nested fields can disappear when an embed becomes a reference, so drop links that lost their field
    return pruneOrphanRelationships({
        ...project,
        collections: project.collections.map((collection) =>
            collection.id === sourceCollection.id
                ? {
                    ...collection,
                    fields: nextFields
                }
                : collection
        ),
        relationships: project.relationships.map((item) =>
            item.id === relationship.id ? updatedRelationship : item
        )
    })
}
