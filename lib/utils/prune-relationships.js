/**
 * keeps relationships consistent with the collections and fields they point at.
 */
import { EMBED_RELATIONSHIP } from "../constants/relationship-types.js"
import { findFieldById } from "./field-tree.js"

/**
 * removes relationships that can no longer be drawn: the source or target collection
 * is gone, the source field is gone, a reference lost its target field, a field points
 * at itself, or an embed sits inside its own collection.
 * a reference to another field of the same collection (like parentId) is fine.
 * returns the same project object when nothing had to be removed.
 * @param {import("../models/factories.js").Project} project project to check
 * @returns {import("../models/factories.js").Project}
 */
export function pruneOrphanRelationships(project) {
    const keptRelationships = project.relationships.filter((relationship) => {
        const sourceCollection = project.collections.find(
            (collection) => collection.id === relationship.sourceCollectionId
        )
        const targetCollection = project.collections.find(
            (collection) => collection.id === relationship.targetCollectionId
        )

        if (!sourceCollection || !targetCollection) {
            return false
        }

        const sourceField = findFieldById(sourceCollection.fields, relationship.sourceFieldId)

        if (!sourceField) {
            return false
        }

        // an embed ends at the card, it cannot sit inside the collection it embeds
        if (relationship.type === EMBED_RELATIONSHIP) {
            return sourceCollection.id !== targetCollection.id
        }

        const targetField = relationship.targetFieldId
            ? findFieldById(targetCollection.fields, relationship.targetFieldId)
            : null

        return targetField !== null && targetField.id !== sourceField.id
    })

    if (keptRelationships.length === project.relationships.length) {
        return project
    }

    return {
        ...project,
        relationships: keptRelationships
    }
}
