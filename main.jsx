/**
 * application entry point.
 * mounts the react tree into the #root element defined in index.html
 * and loads the global styles.
 */
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./app.jsx"
import ModelerProvider from "./components/providers/modeler-provider.jsx"
import ThemeProvider from "./components/providers/theme-provider.jsx"
import "./styles/global.css"

// root dom node the whole app renders into
const rootElement = document.getElementById("root")

createRoot(rootElement).render(
    <StrictMode>
        {/* theme provider, everything inside can use useTheme */}
        <ThemeProvider>
            {/* modeler state provider, everything inside can use useModeler */}
            <ModelerProvider>
                <App />
            </ModelerProvider>
        </ThemeProvider>
    </StrictMode>
)
