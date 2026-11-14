/**
 * left sidebar with the list of collections and the add button.
 */
import { ADD_COLLECTION } from "../../lib/constants/action-types.js"
import {
    NEW_COLLECTION_CASCADE_OFFSET,
    NEW_COLLECTION_HALF_HEIGHT,
    NEW_COLLECTION_HALF_WIDTH
} from "../../lib/constants/canvas-config.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { useViewportCenter } from "../../lib/hooks/use-viewport-center.js"
import { findFreePosition } from "../../lib/utils/find-free-position.js"
import CollectionSidebarItem from "./collection-sidebar-item.jsx"

/**
 * collection list sidebar.
 * @returns {JSX.Element}
 */
function CollectionSidebar() {
    const { state, dispatch } = useModeler()
    const { collections } = state.project
    const getViewportCenter = useViewportCenter()

    /**
     * adds a new auto named collection in the middle of the part of the canvas
     * the user is looking at, moved aside when another card already sits there.
     */
    function handleAddCollection() {
        const viewportCenter = getViewportCenter()
        const newPosition = findFreePosition(
            {
                x: Math.round(viewportCenter.x - NEW_COLLECTION_HALF_WIDTH),
                y: Math.round(viewportCenter.y - NEW_COLLECTION_HALF_HEIGHT)
            },
            collections.map((collection) => collection.position),
            NEW_COLLECTION_CASCADE_OFFSET
        )

        dispatch({
            type: ADD_COLLECTION,
            position: newPosition
        })
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
