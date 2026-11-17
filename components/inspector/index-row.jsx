/**
 * one index of the selected collection, edited in place.
 * an index is a list of keys (a field and a direction). one key is a single field index,
 * more keys make a compound index, where the order of the keys matters.
 * the fields themselves are never changed here.
 */
import {
    DELETE_INDEX,
    UPDATE_INDEX
} from "../../lib/constants/action-types.js"
import {
    DEFAULT_INDEX_DIRECTION,
    INDEX_DIRECTIONS,
    MAX_INDEX_KEYS
} from "../../lib/constants/index-options.js"
import { createIndexKey } from "../../lib/models/factories.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { formatFieldType } from "../../lib/utils/format-field-type.js"
import { getIndexableFields } from "../../lib/utils/index-operations.js"
import {
    getIndexName,
    getIndexWarning
} from "../../lib/utils/index-summary.js"

/**
 * index row.
 * @param {{ collection: import("../../lib/models/factories.js").Collection, index: import("../../lib/models/factories.js").Index }} props
 * @returns {JSX.Element}
 */
function IndexRow({ collection, index }) {
    const { dispatch } = useModeler()

    const indexableFields = getIndexableFields(collection)
    const usedFieldIds = new Set(index.keys.map((key) => key.fieldId))
    const nextFreeField = indexableFields.find((entry) => !usedFieldIds.has(entry.id))
    const canAddKey = Boolean(nextFreeField) && index.keys.length < MAX_INDEX_KEYS
    const isCompound = index.keys.length > 1
    const warningMessage = getIndexWarning(collection, index)

    /**
     * saves changes to this index.
     * @param {{ keys?: import("../../lib/models/factories.js").IndexKey[], unique?: boolean }} changes
     */
    function updateIndex(changes) {
        dispatch({
            type: UPDATE_INDEX,
            collectionId: collection.id,
            indexId: index.id,
            changes
        })
    }

    /** replaces one key of the index */
    function updateKey(keyPosition, keyChanges) {
        updateIndex({
            keys: index.keys.map((key, position) =>
                position === keyPosition
                    ? {
                        ...key,
                        ...keyChanges
                    }
                    : key
            )
        })
    }

    /** adds the next free field as the last key, which makes the index compound */
    function handleAddKey() {
        updateIndex({ keys: [...index.keys, createIndexKey(nextFreeField.id, DEFAULT_INDEX_DIRECTION)] })
    }

    /** removes one key, an index always keeps at least one */
    function handleRemoveKey(keyPosition) {
        updateIndex({ keys: index.keys.filter((key, position) => position !== keyPosition) })
    }

    /** deletes the whole index, the fields stay */
    function handleDelete() {
        dispatch({
            type: DELETE_INDEX,
            collectionId: collection.id,
            indexId: index.id
        })
    }

    return (
        <li className="index-row">
            {/* index name, unique checkbox and delete button */}
            <div className="index-row-header">
                <span
                    className="index-name"
                    title={isCompound ? "compound index, the order of the fields matters" : "single field index"}
                >
                    {getIndexName(collection, index)}
                </span>

                <label className="field-row-required">
                    <input
                        type="checkbox"
                        checked={index.unique}
                        onChange={(event) => updateIndex({ unique: event.target.checked })}
                    />
                    unique
                </label>

                <button
                    type="button"
                    className="field-icon-button"
                    title="delete index (the fields stay)"
                    onClick={handleDelete}
                >
                    x
                </button>
            </div>

            {/* one row per key: field and direction */}
            {index.keys.map((key, keyPosition) => (
                <div
                    key={`${index.id}-${keyPosition}`}
                    className="index-key-row"
                >
                    <select
                        className="field-row-select index-field-select"
                        value={key.fieldId}
                        onChange={(event) => updateKey(keyPosition, { fieldId: event.target.value })}
                        title="indexed field"
                    >
                        {indexableFields
                            .filter((entry) => entry.id === key.fieldId || !usedFieldIds.has(entry.id))
                            .map((entry) => (
                                <option key={entry.id} value={entry.id}>
                                    {entry.path} ({formatFieldType(entry.field)})
                                </option>
                            ))}
                    </select>

                    <select
                        className="field-row-select"
                        value={key.direction}
                        onChange={(event) => updateKey(keyPosition, { direction: Number(event.target.value) })}
                        title="sort direction of this key"
                    >
                        {INDEX_DIRECTIONS.map((direction) => (
                            <option key={direction.value} value={direction.value}>
                                {direction.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="field-icon-button"
                        disabled={!isCompound}
                        title="remove this field from the index"
                        onClick={() => handleRemoveKey(keyPosition)}
                    >
                        x
                    </button>
                </div>
            ))}

            {/* add another field, which makes the index compound */}
            <button
                type="button"
                className="index-add-key-button"
                disabled={!canAddKey}
                title="add another field, mongodb uses a compound index for queries that start with its first fields"
                onClick={handleAddKey}
            >
                + field
            </button>

            {/* warning when mongodb would complain about the index */}
            {warningMessage && <div className="relationship-warning">{warningMessage}</div>}
        </li>
    )
}

export default IndexRow
