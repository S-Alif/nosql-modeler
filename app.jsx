/**
 * root component and layout shell of the modeler.
 * toolbar and inspector are still placeholders (see docs/batches.md),
 * the sidebar and the canvas are real feature components.
 */
import DiagramCanvas from "./components/canvas/diagram-canvas.jsx"
import CollectionSidebar from "./components/sidebar/collection-sidebar.jsx"

/**
 * app layout: toolbar on top, collection sidebar left,
 * diagram canvas in the middle, field inspector right.
 * @returns {JSX.Element}
 */
function App() {
    return (
        <div className="app-shell">
            {/* top toolbar (batch 7: export and import buttons) */}
            <header className="app-toolbar">Mongo Modeler</header>

            {/* collection list sidebar */}
            <CollectionSidebar />

            {/* diagram canvas */}
            <main className="app-canvas">
                <DiagramCanvas />
            </main>

            {/* field and index inspector (batch 4 and 6) */}
            <aside className="app-inspector">Inspector</aside>
        </div>
    )
}

export default App
