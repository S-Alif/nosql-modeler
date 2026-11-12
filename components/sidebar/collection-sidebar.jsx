/**
 * left sidebar with the list of collections and the add button.
 */
import { ADD_COLLECTION } from "../../lib/constants/action-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import CollectionSidebarItem from "./collection-sidebar-item.jsx"

/**
 * collection list sidebar.
 * @returns {JSX.Element}
 */
function CollectionSidebar() {
    const { state, dispatch } = useModeler()
    const { collections } = state.project

    /** adds a new auto named collection */
    function handleAddCollection() {
        dispatch({ type: ADD_COLLECTION })
    }

    return (
        <aside className="app-sidebar">
            {/* sidebar title and add button */}
            <div className="sidebar-header">
                <h2 className="sidebar-title">Collections</h2>
                <button
                    type="button"
                    className="sidebar-add-button"
                    onClick={handleAddCollection}
                >
                    + add
                </button>
            </div>

            {/* collection list */}
            <ul className="sidebar-list">
                {collections.map((collection) => (
                    <CollectionSidebarItem
                        key={collection.id}
                        collection={collection}
                        isSelected={collection.id === state.selectedCollectionId}
                    />
                ))}
            </ul>

            {/* empty list hint */}
            {collections.length === 0 && (
                <p className="sidebar-hint">no collections yet</p>
            )}

            {/* usage hint */}
            {collections.length > 0 && (
                <p className="sidebar-hint">double click a name to rename</p>
            )}
        </aside>
    )
}

export default CollectionSidebar
