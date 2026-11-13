/**
 * root component and layout shell of the modeler.
 * the toolbar is still a placeholder (see docs/batches.md),
 * the sidebar, the canvas and the inspector are real feature components.
 */
import DiagramCanvas from "./components/canvas/diagram-canvas.jsx"
import FieldInspector from "./components/inspector/field-inspector.jsx"
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

            {/* field inspector (batch 6 adds the index editor here) */}
            <FieldInspector />
        </div>
    )
}

export default App
