/**
 * keeps relationships consistent with the collections and fields they point at.
 */
import { findFieldById } from "./field-tree.js"

/**
 * removes relationships that can no longer be drawn: the source or target
 * collection is gone, the source field is gone, or both ends are the same collection.
 * returns the same project object when nothing had to be removed.
 * @param {import("../models/factories.js").Project} project project to check
 * @returns {import("../models/factories.js").Project}
 */
export function pruneOrphanRelationships(project) {
    const keptRelationships = project.relationships.filter((relationship) => {
        const sourceCollection = project.collections.find(
            (collection) => collection.id === relationship.sourceCollectionId
        )
        const targetCollectionExists = project.collections.some(
            (collection) => collection.id === relationship.targetCollectionId
        )
        const isSelfLink = relationship.sourceCollectionId === relationship.targetCollectionId

        return (
            Boolean(sourceCollection) &&
            targetCollectionExists &&
            !isSelfLink &&
            findFieldById(sourceCollection.fields, relationship.sourceFieldId) !== null
        )
    })

    if (keptRelationships.length === project.relationships.length) {
        return project
    }

    return {
        ...project,
        relationships: keptRelationships
    }
}
