/**
 * one row of the collection sidebar list.
 * click selects, double click renames, the x button deletes.
 */
import { useState } from "react"
import {
    DELETE_COLLECTION,
    RENAME_COLLECTION,
    SELECT_COLLECTION
} from "../../lib/constants/action-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { validateCollectionName } from "../../lib/validators/collection-name-validator.js"

/**
 * sidebar row for one collection.
 * @param {{ collection: import("../../lib/models/factories.js").Collection, isSelected: boolean }} props
 * @returns {JSX.Element}
 */
function CollectionSidebarItem({ collection, isSelected }) {
    const { state, dispatch } = useModeler()
    const [isEditing, setIsEditing] = useState(false)
    const [draftName, setDraftName] = useState(collection.name)
    const [errorMessage, setErrorMessage] = useState(null)

    /** switches the row to rename mode */
    function startEditing() {
        setDraftName(collection.name)
        setErrorMessage(null)
        setIsEditing(true)
    }

    /** leaves rename mode without saving */
    function cancelEditing() {
        setErrorMessage(null)
        setIsEditing(false)
    }

    /**
     * validates the draft name and returns an error message or null.
     * @returns {string | null}
     */
    function getDraftError() {
        const otherCollectionNames = state.project.collections
            .filter((otherCollection) => otherCollection.id !== collection.id)
            .map((otherCollection) => otherCollection.name)

        return validateCollectionName(draftName, otherCollectionNames)
    }

    /** enter key: save when valid, otherwise show the error and stay in rename mode */
    function commitRename() {
        const draftError = getDraftError()

        if (draftError) {
            setErrorMessage(draftError)
            return
        }

        dispatch({
            type: RENAME_COLLECTION,
            collectionId: collection.id,
            name: draftName.trim()
        })
        setIsEditing(false)
    }

    /** blur: save when valid, otherwise throw the draft away */
    function handleBlur() {
        if (getDraftError()) {
            cancelEditing()
            return
        }

        commitRename()
    }

    /** handles enter and escape inside the rename input */
    function handleInputKeyDown(event) {
        if (event.key === "Enter") {
            commitRename()
        } else if (event.key === "Escape") {
            cancelEditing()
        }
    }

    /** deletes the collection, asks first when it already has fields */
    function handleDelete() {
        const needsConfirmation = collection.fields.length > 0
        const isConfirmed =
            !needsConfirmation ||
            window.confirm(`delete "${collection.name}" and its ${collection.fields.length} fields?`)

        if (isConfirmed) {
            dispatch({
                type: DELETE_COLLECTION,
                collectionId: collection.id
            })
        }
    }

    return (
        <li className={isSelected ? "sidebar-item sidebar-item-selected" : "sidebar-item"}>
            {/* collection name, or rename input while editing */}
            {isEditing ? (
                <div className="sidebar-item-edit">
                    <input
                        className="sidebar-item-input"
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onBlur={handleBlur}
                        autoFocus
                    />
                    {errorMessage && <div className="sidebar-item-error">{errorMessage}</div>}
                </div>
            ) : (
                <button
                    type="button"
                    className="sidebar-item-name"
                    title="double click to rename"
                    onClick={() =>
                        dispatch({
                            type: SELECT_COLLECTION,
                            collectionId: collection.id
                        })
                    }
                    onDoubleClick={startEditing}
                >
                    {collection.name}
                </button>
            )}

            {/* delete collection button */}
            <button
                type="button"
                className="sidebar-item-delete"
                title="delete collection"
                onClick={handleDelete}
            >
                x
            </button>
        </li>
    )
}

export default CollectionSidebarItem
