/**
 * relationships section of the inspector for the selected collection.
 * it lists the relationships that start here (editable rows) and the ones
 * from other collections that point here (read only, click to jump to them).
 */
import {
    ADD_RELATIONSHIP,
    SELECT_COLLECTION
} from "../../lib/constants/action-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { getFieldPath } from "../../lib/utils/field-paths.js"
import RelationshipRow from "./relationship-row.jsx"

/**
 * relationship section.
 * @param {{ collection: import("../../lib/models/factories.js").Collection }} props the selected collection
 * @returns {JSX.Element}
 */
function RelationshipList({ collection }) {
    const { state, dispatch } = useModeler()
    const { collections, relationships } = state.project

    const otherCollections = collections.filter((otherCollection) => otherCollection.id !== collection.id)
    const outgoingRelationships = relationships.filter(
        (relationship) => relationship.sourceCollectionId === collection.id
    )
    const incomingRelationships = relationships.filter(
        (relationship) => relationship.targetCollectionId === collection.id
    )
    const canAddRelationship = otherCollections.length > 0

    /** adds a reference to the first other collection, the target can be changed in the new row */
    function handleAddRelationship() {
        dispatch({
            type: ADD_RELATIONSHIP,
            sourceCollectionId: collection.id,
            targetCollectionId: otherCollections[0].id
        })
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
                    title="adds a field that links to another collection, or drag between two cards on the canvas"
                    onClick={handleAddRelationship}
                >
                    + relationship
                </button>
            </div>

            {/* hint when there is nothing to link to */}
            {!canAddRelationship && (
                <p className="inspector-hint">add another collection to link it</p>
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
                                        {sourceCollection?.name}.{fieldPath} ({relationship.type})
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
