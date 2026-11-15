/**
 * relationships section of the inspector for the selected collection.
 * it lists the relationships that start here (editable rows) and the ones
 * from other collections that point here (read only, click to jump to them).
 * a relationship connects two existing fields, so a field has to exist before it can be linked.
 */
import {
    ADD_RELATIONSHIP,
    SELECT_COLLECTION
} from "../../lib/constants/action-types.js"
import {
    EMBED_RELATIONSHIP,
    REFERENCE_RELATIONSHIP
} from "../../lib/constants/relationship-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { flattenFieldPaths, getFieldPath } from "../../lib/utils/field-paths.js"
import { getDefaultTargetField } from "../../lib/utils/relationship-rules.js"
import RelationshipRow from "./relationship-row.jsx"

/**
 * relationship section.
 * @param {{ collection: import("../../lib/models/factories.js").Collection }} props the selected collection
 * @returns {JSX.Element}
 */
function RelationshipList({ collection }) {
    const { state, dispatch } = useModeler()
    const { collections, relationships } = state.project

    const outgoingRelationships = relationships.filter(
        (relationship) => relationship.sourceCollectionId === collection.id
    )
    const incomingRelationships = relationships.filter(
        (relationship) => relationship.targetCollectionId === collection.id
    )

    // a field can start a relationship when it is not an _id and does not back another one yet
    const usedSourceFieldIds = new Set(relationships.map((relationship) => relationship.sourceFieldId))
    const freeSourceFields = flattenFieldPaths(collection.fields).filter(
        (entry) => !entry.field.isSystem && !usedSourceFieldIds.has(entry.id)
    )
    const canAddRelationship = freeSourceFields.length > 0

    /**
     * connects the first free field to the _id of another collection (or of this one when it is
     * the only collection). the source field, target and type can be changed in the new row.
     */
    function handleAddRelationship() {
        const targetCollection =
            collections.find((otherCollection) => otherCollection.id !== collection.id) ?? collection
        const targetField = getDefaultTargetField(targetCollection)

        dispatch({
            type: ADD_RELATIONSHIP,
            relationship: {
                type: REFERENCE_RELATIONSHIP,
                sourceCollectionId: collection.id,
                sourceFieldId: freeSourceFields[0].id,
                targetCollectionId: targetCollection.id,
                targetFieldId: targetField.id
            }
        })
    }

    /**
     * describes where an incoming relationship points inside this collection.
     * @param {import("../../lib/models/factories.js").Relationship} relationship incoming relationship
     * @returns {string}
     */
    function describeIncomingTarget(relationship) {
        if (relationship.type === EMBED_RELATIONSHIP) {
            return "embedded here"
        }

        return getFieldPath(collection.fields, relationship.targetFieldId) ?? ""
    }

    return (
        <section className="relationship-section">
            {/* section header and add button */}
            <div className="inspector-header">
                <h3 className="relationship-title">Relationships</h3>
                <button
                    type="button"
                    className="sidebar-add-button"
                    disabled={!canAddRelationship}
                    title="links one of this collection's fields to a field of another collection, or drag from a field's dot to another field on the canvas"
                    onClick={handleAddRelationship}
                >
                    + relationship
                </button>
            </div>

            {/* hint when there is no field left to link */}
            {!canAddRelationship && (
                <p className="inspector-hint">
                    add a field first, then link it to a field of another collection
                </p>
            )}

            {/* relationships that start in this collection */}
            <ul className="field-list">
                {outgoingRelationships.map((relationship) => (
                    <RelationshipRow
                        key={relationship.id}
                        relationship={relationship}
                    />
                ))}
            </ul>

            {/* relationships from other collections that point here */}
            {incomingRelationships.length > 0 && (
                <div className="relationship-incoming">
                    <h4 className="relationship-incoming-title">used by</h4>
                    <ul className="relationship-incoming-list">
                        {incomingRelationships.map((relationship) => {
                            const sourceCollection = collections.find(
                                (otherCollection) => otherCollection.id === relationship.sourceCollectionId
                            )
                            const fieldPath = sourceCollection
                                ? getFieldPath(sourceCollection.fields, relationship.sourceFieldId)
                                : null

                            return (
                                <li key={relationship.id}>
                                    <button
                                        type="button"
                                        className="relationship-incoming-button"
                                        onClick={() =>
                                            dispatch({
                                                type: SELECT_COLLECTION,
                                                collectionId: relationship.sourceCollectionId
                                            })
                                        }
                                    >
                                        {sourceCollection?.name}.{fieldPath} → {describeIncomingTarget(relationship)}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}
        </section>
    )
}

export default RelationshipList
