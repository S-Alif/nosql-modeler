/**
 * application entry point.
 * mounts the react tree into the #root element defined in index.html
 * and loads the global styles.
 */
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./app.jsx"
import ModelerProvider from "./components/providers/modeler-provider.jsx"
import "./styles/global.css"

// root dom node the whole app renders into
const rootElement = document.getElementById("root")

createRoot(rootElement).render(
    <StrictMode>
        {/* modeler state provider, everything inside can use useModeler */}
        <ModelerProvider>
            <App />
        </ModelerProvider>
    </StrictMode>
)
