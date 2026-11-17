/**
 * indexes section of the inspector for the selected collection.
 * it lists the indexes of the collection (editable rows) and, read only, the fields that have a
 * ttl, because a ttl on a date field is an index too. the ttl itself is edited on the field.
 */
import { ADD_INDEX } from "../../lib/constants/action-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { getIndexableFields } from "../../lib/utils/index-operations.js"
import { listTtlFields } from "../../lib/utils/index-summary.js"
import IndexRow from "./index-row.jsx"

/**
 * index section.
 * @param {{ collection: import("../../lib/models/factories.js").Collection }} props the selected collection
 * @returns {JSX.Element}
 */
function IndexList({ collection }) {
    const { dispatch } = useModeler()

    const singleIndexedFieldIds = new Set(
        collection.indexes.filter((index) => index.keys.length === 1).map((index) => index.keys[0].fieldId)
    )
    const canAddIndex = getIndexableFields(collection).some((entry) => !singleIndexedFieldIds.has(entry.id))
    const ttlFields = listTtlFields(collection)

    /** adds an index on the first field that has no single field index yet */
    function handleAddIndex() {
        dispatch({
            type: ADD_INDEX,
            collectionId: collection.id
        })
    }

    return (
        <section className="index-section">
            {/* section header and add button */}
            <div className="inspector-header">
                <h3 className="relationship-title">Indexes</h3>
                <button
                    type="button"
                    className="sidebar-add-button"
                    disabled={!canAddIndex}
                    title="adds an index on a field, then pick its fields, direction and whether it is unique"
                    onClick={handleAddIndex}
                >
                    + index
                </button>
            </div>

            {/* hint when there is nothing to index */}
            {collection.indexes.length === 0 && (
                <p className="inspector-hint">
                    {canAddIndex
                        ? "no indexes yet, _id is always indexed by mongodb"
                        : "add a field first, then index it (_id is always indexed by mongodb)"}
                </p>
            )}

            {/* indexes of this collection */}
            <ul className="field-list">
                {collection.indexes.map((index) => (
                    <IndexRow
                        key={index.id}
                        collection={collection}
                        index={index}
                    />
                ))}
            </ul>

            {/* fields with a ttl, read only */}
            {ttlFields.length > 0 && (
                <div className="relationship-incoming">
                    <h4 className="relationship-incoming-title">ttl (set on the field)</h4>
                    <ul className="relationship-incoming-list">
                        {ttlFields.map((ttlField) => (
                            <li
                                key={ttlField.id}
                                className="index-ttl-item"
                                title={`${ttlField.seconds} seconds`}
                            >
                                {ttlField.path}: expires after {ttlField.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    )
}

export default IndexList
