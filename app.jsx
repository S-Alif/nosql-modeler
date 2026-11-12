/**
 * root component and layout shell of the modeler.
 * the sidebar already lists real collections from state (temporary, batch 3
 * replaces it with a proper sidebar component). the other regions are
 * still placeholders (see docs/batches.md).
 */
import {
    ADD_COLLECTION,
    DELETE_COLLECTION,
    SELECT_COLLECTION
} from "./lib/constants/action-types.js"
import { useModeler } from "./lib/hooks/use-modeler.js"

/**
 * app layout: toolbar on top, collection sidebar left,
 * diagram canvas in the middle, field inspector right.
 * @returns {JSX.Element}
 */
function App() {
    const { state, dispatch } = useModeler()
    const { collections } = state.project

    /** adds a new auto named collection */
    function handleAddCollection() {
        dispatch({ type: ADD_COLLECTION })
    }

    return (
        <div className="app-shell">
            {/* top toolbar (batch 7: export and import buttons) */}
            <header className="app-toolbar">Mongo Modeler</header>

            {/* collection list sidebar (temporary, batch 3 replaces it) */}
            <aside className="app-sidebar">
                <button
                    type="button"
                    className="sidebar-button"
                    onClick={handleAddCollection}
                >
                    + add collection
                </button>

                <ul className="sidebar-list">
                    {collections.map((collection) => (
                        <li
                            key={collection.id}
                            className={
                                collection.id === state.selectedCollectionId
                                    ? "sidebar-item sidebar-item-selected"
                                    : "sidebar-item"
                            }
                        >
                            {/* select collection button */}
                            <button
                                type="button"
                                className="sidebar-item-name"
                                onClick={() =>
                                    dispatch({
                                        type: SELECT_COLLECTION,
                                        collectionId: collection.id
                                    })
                                }
                            >
                                {collection.name}
                            </button>

                            {/* delete collection button */}
                            <button
                                type="button"
                                className="sidebar-item-delete"
                                onClick={() =>
                                    dispatch({
                                        type: DELETE_COLLECTION,
                                        collectionId: collection.id
                                    })
                                }
                            >
                                x
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            {/* diagram canvas (batch 3: react flow) */}
            <main className="app-canvas">Canvas</main>

            {/* field and index inspector (batch 4 and 6) */}
            <aside className="app-inspector">Inspector</aside>
        </div>
    )
}

export default App
