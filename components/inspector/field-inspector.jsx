/**
 * right side inspector that edits the fields of the selected collection.
 * the rows (and their nested rows) are drawn by field-row.jsx.
 */
import { ADD_FIELD } from "../../lib/constants/action-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import FieldRow from "./field-row.jsx"
import RelationshipList from "./relationship-list.jsx"

/**
 * field inspector.
 * @returns {JSX.Element}
 */
function FieldInspector() {
    const { state, dispatch } = useModeler()

    const selectedCollection = state.project.collections.find(
        (collection) => collection.id === state.selectedCollectionId
    )

    // nothing selected hint
    if (!selectedCollection) {
        return (
            <aside className="app-inspector">
                <p className="inspector-hint">select a collection to edit its fields</p>
            </aside>
        )
    }

    /** adds a new top level field to the selected collection */
    function handleAddField() {
        dispatch({
            type: ADD_FIELD,
            collectionId: selectedCollection.id,
            parentFieldId: null
        })
    }

    return (
        <aside className="app-inspector">
            {/* inspector header: collection name and add field button */}
            <div className="inspector-header">
                <h2 className="inspector-title">{selectedCollection.name}</h2>
                <button
                    type="button"
                    className="sidebar-add-button"
                    onClick={handleAddField}
                >
                    + field
                </button>
            </div>

            {/* field list */}
            <ul className="field-list">
                {selectedCollection.fields.map((field) => (
                    <FieldRow
                        key={field.id}
                        collectionId={selectedCollection.id}
                        field={field}
                        siblingFields={selectedCollection.fields}
                        parentFieldId={null}
                    />
                ))}
            </ul>

            {/* empty field list hint */}
            {selectedCollection.fields.length === 0 && (
                <p className="inspector-hint">no fields yet</p>
            )}

            {/* relationships of the selected collection */}
            <RelationshipList collection={selectedCollection} />
        </aside>
    )
}

export default FieldInspector
