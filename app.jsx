/**
 * root component and layout shell of the modeler.
 * the toolbar, the sidebar, the canvas and the inspector are feature components.
 * everything sits inside <ReactFlowProvider> so the sidebar can ask the canvas
 * what part of the diagram is currently visible.
 */
import { ReactFlowProvider } from "@xyflow/react"
import DiagramCanvas from "./components/canvas/diagram-canvas.jsx"
import FieldInspector from "./components/inspector/field-inspector.jsx"
import CollectionSidebar from "./components/sidebar/collection-sidebar.jsx"
import AppToolbar from "./components/toolbar/app-toolbar.jsx"

/**
 * app layout: toolbar on top, collection sidebar left,
 * diagram canvas in the middle, field inspector right.
 * @returns {JSX.Element}
 */
function App() {
    return (
        <ReactFlowProvider>
            <div className="app-shell">
                {/* top toolbar with the import, image and export buttons */}
                <AppToolbar />

                {/* collection list sidebar */}
                <CollectionSidebar />

                {/* diagram canvas */}
                <main className="app-canvas">
                    <DiagramCanvas />
                </main>

                {/* field inspector: fields, relationships and indexes */}
                <FieldInspector />
            </div>
        </ReactFlowProvider>
    )
}

export default App
