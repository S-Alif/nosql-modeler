/**
 * export dialog: pick a format, look at the generated files, copy or download them.
 * the files are rebuilt from the project every time the dialog renders its content, so what
 * you see is always the current diagram. several files are downloaded together as one zip.
 */
import {
    useEffect,
    useMemo,
    useState
} from "react"
import {
    DEFAULT_MONGOOSE_OPTIONS,
    EXPORT_FORMATS,
    MONGOOSE_FORMAT
} from "../../lib/constants/export-formats.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { buildExportFiles } from "../../lib/utils/build-export-files.js"
import { createZip } from "../../lib/utils/create-zip.js"
import {
    copyTextToClipboard,
    downloadBlob,
    downloadTextFile
} from "../../lib/utils/download-file.js"

// how long the "copied" label stays on the copy button, in milliseconds
const COPIED_LABEL_MS = 1500

/**
 * export dialog.
 * @param {{ onClose: Function }} props onClose is called when the dialog should close
 * @returns {JSX.Element}
 */
function ExportDialog({ onClose }) {
    const { state } = useModeler()
    const [formatId, setFormatId] = useState(MONGOOSE_FORMAT)
    const [mongooseOptions, setMongooseOptions] = useState(DEFAULT_MONGOOSE_OPTIONS)
    const [selectedFileName, setSelectedFileName] = useState(null)
    const [isCopied, setIsCopied] = useState(false)

    const files = useMemo(
        () => buildExportFiles(formatId, state.project, mongooseOptions),
        [formatId, state.project, mongooseOptions]
    )
    const selectedFile = files.find((file) => file.name === selectedFileName) ?? files[0] ?? null
    const selectedFormat = EXPORT_FORMATS.find((format) => format.id === formatId)

    // escape closes the dialog
    useEffect(() => {
        /** closes the dialog on escape */
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose()
            }
        }

        document.addEventListener("keydown", handleKeyDown)

        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [onClose])

    /** switches format and forgets the selected file, it may not exist in the new format */
    function handleFormatChange(nextFormatId) {
        setFormatId(nextFormatId)
        setSelectedFileName(null)
    }

    /** copies the shown file to the clipboard */
    async function handleCopy() {
        const wasCopied = await copyTextToClipboard(selectedFile.content)

        setIsCopied(wasCopied)
        setTimeout(() => setIsCopied(false), COPIED_LABEL_MS)
    }

    /** downloads the shown file */
    function handleDownloadFile() {
        const isJson = selectedFile.name.endsWith(".json")

        downloadTextFile(selectedFile.name, selectedFile.content, isJson ? "application/json" : "text/javascript")
    }

    /** downloads every file of the format as one zip, keeping the folder names */
    function handleDownloadZip() {
        downloadBlob(`${formatId}-export.zip`, new Blob([createZip(files)], { type: "application/zip" }))
    }

    return (
        <div
            className="dialog-backdrop"
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
            <div
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Export"
            >
                {/* dialog header */}
                <div className="dialog-header">
                    <h2 className="dialog-title">Export</h2>
                    <button
                        type="button"
                        className="field-icon-button"
                        title="close (escape)"
                        onClick={onClose}
                    >
                        x
                    </button>
                </div>

                {/* format picker */}
                <div className="dialog-formats">
                    {EXPORT_FORMATS.map((format) => (
                        <button
                            key={format.id}
                            type="button"
                            className={format.id === formatId ? "dialog-format dialog-format-active" : "dialog-format"}
                            onClick={() => handleFormatChange(format.id)}
                        >
                            {format.label}
                        </button>
                    ))}
                </div>

                <p className="inspector-hint">{selectedFormat.description}</p>

                {/* mongoose options */}
                {formatId === MONGOOSE_FORMAT && (
                    <div className="dialog-options">
                        <label className="field-row-required">
                            <input
                                type="checkbox"
                                checked={mongooseOptions.timestamps}
                                onChange={(event) =>
                                    setMongooseOptions({
                                        ...mongooseOptions,
                                        timestamps: event.target.checked
                                    })
                                }
                            />
                            timestamps (createdAt and updatedAt)
                        </label>
                        <label className="field-row-required">
                            <input
                                type="checkbox"
                                checked={mongooseOptions.versionKey}
                                onChange={(event) =>
                                    setMongooseOptions({
                                        ...mongooseOptions,
                                        versionKey: event.target.checked
                                    })
                                }
                            />
                            version key (__v)
                        </label>
                    </div>
                )}

                {/* file list, code preview and actions */}
                {selectedFile ? (
                    <>
                        {files.length > 1 && (
                            <div className="dialog-files">
                                {files.map((file) => (
                                    <button
                                        key={file.name}
                                        type="button"
                                        className={file.name === selectedFile.name ? "dialog-file dialog-file-active" : "dialog-file"}
                                        onClick={() => setSelectedFileName(file.name)}
                                    >
                                        {file.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <pre className="dialog-code">{selectedFile.content}</pre>

                        <div className="dialog-actions">
                            <button
                                type="button"
                                className="dialog-button"
                                onClick={handleCopy}
                            >
                                {isCopied ? "Copied" : "Copy"}
                            </button>
                            <button
                                type="button"
                                className="dialog-button"
                                onClick={handleDownloadFile}
                            >
                                Download {selectedFile.name.split("/").pop()}
                            </button>
                            {files.length > 1 && (
                                <button
                                    type="button"
                                    className="sidebar-add-button"
                                    onClick={handleDownloadZip}
                                >
                                    Download all as zip
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="inspector-hint">add a collection first, there is nothing to export yet</p>
                )}
            </div>
        </div>
    )
}

export default ExportDialog
