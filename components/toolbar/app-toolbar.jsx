/**
 * top toolbar: the app name on the left, the import, image and export buttons, and the github link on the right.
 * import reads a project json file, export opens the export dialog, image / pdf opens the image dialog.
 * the link address comes from lib/constants/app-info.js, until it is set a dashed
 * placeholder is shown so the spot is easy to find.
 */
import { useReactFlow } from "@xyflow/react"
import { useRef, useState } from "react"
import { REPLACE_PROJECT } from "../../lib/constants/action-types.js"
import { APP_NAME, PROJECT_GITHUB_URL } from "../../lib/constants/app-info.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { parseProjectJson } from "../../lib/utils/project-json.js"
import ExportDialog from "../export/export-dialog.jsx"
import ImageExportDialog from "../export/image-export-dialog.jsx"
import ThemeSwitcher from "./theme-switcher.jsx"

/**
 * small logo mark: three linked collections.
 * @returns {JSX.Element}
 */
function ToolbarLogo() {
    return (
        <svg
            className="toolbar-logo"
            viewBox="0 0 26 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <rect x="2" y="3" width="9" height="7" rx="2" />
            <rect x="15" y="3" width="9" height="7" rx="2" />
            <rect x="8.5" y="16" width="9" height="7" rx="2" />
            <path d="M6.5 10v2.5h6.5V16M19.5 10v2.5H13" />
        </svg>
    )
}

/**
 * toolbar shown above the three panels.
 * @returns {JSX.Element}
 */
function AppToolbar() {
    const { state, dispatch } = useModeler()
    const { fitView } = useReactFlow()
    const importInputRef = useRef(null)
    const [isExportOpen, setIsExportOpen] = useState(false)
    const [isImageExportOpen, setIsImageExportOpen] = useState(false)
    const hasCollections = state.project.collections.length > 0

    /** reads the chosen project json file and replaces the project after a confirmation */
    async function handleImportFile(event) {
        const chosenFile = event.target.files?.[0]

        // clear the input so choosing the same file again still fires a change
        event.target.value = ""

        if (!chosenFile) {
            return
        }

        const { project, error } = parseProjectJson(await chosenFile.text())

        if (error) {
            window.alert(`could not import ${chosenFile.name}: ${error}`)
            return
        }

        const importMessage = hasCollections
            ? `replace the current diagram (${state.project.collections.length} collections) with ${project.collections.length} collections from ${chosenFile.name}? export the current one first if you want to keep it.`
            : `import ${project.collections.length} collections from ${chosenFile.name}?`

        if (window.confirm(importMessage)) {
            dispatch({
                type: REPLACE_PROJECT,
                project
            })

            // show the imported diagram once react flow has drawn the new cards
            setTimeout(() => fitView({ padding: 0.2 }), 100)
        }
    }

    return (
        <header className="app-toolbar">
            {/* app name and logo */}
            <div className="toolbar-brand">
                <ToolbarLogo />
                <span>{APP_NAME}</span>
            </div>

            <div className="toolbar-spacer"></div>

            {/* light, auto and dark theme */}
            <ThemeSwitcher />

            {/* import, export and image */}
            <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={handleImportFile}
            />
            <button
                type="button"
                className="toolbar-button"
                title="import a project json file"
                onClick={() => importInputRef.current?.click()}
            >
                Import
            </button>
            <button
                type="button"
                className="toolbar-button"
                disabled={!hasCollections}
                title="save the whole diagram as a png image or a pdf"
                onClick={() => setIsImageExportOpen(true)}
            >
                Image / PDF
            </button>
            <button
                type="button"
                className="toolbar-button toolbar-button-primary"
                onClick={() => setIsExportOpen(true)}
            >
                Export
            </button>

            {/* github link, add the address in lib/constants/app-info.js */}
            {PROJECT_GITHUB_URL ? (
                <a
                    className="toolbar-link"
                    href={PROJECT_GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                >
                    GitHub
                </a>
            ) : (
                <span
                    className="toolbar-link toolbar-link-unset"
                    title="set PROJECT_GITHUB_URL in lib/constants/app-info.js"
                >
                    GitHub
                </span>
            )}

            {/* export dialog */}
            {isExportOpen && <ExportDialog onClose={() => setIsExportOpen(false)} />}

            {/* image and pdf dialog */}
            {isImageExportOpen && <ImageExportDialog onClose={() => setIsImageExportOpen(false)} />}
        </header>
    )
}

export default AppToolbar
