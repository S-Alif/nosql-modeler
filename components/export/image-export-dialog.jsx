/**
 * dialog that saves the whole diagram as a png image or a pdf file.
 * the options are the file format, the dot grid, the shadow under the cards and, for pdf,
 * the paper size. the selection is cleared first so no card or thread is drawn highlighted.
 */
import { useReactFlow } from "@xyflow/react"
import {
    useEffect,
    useState
} from "react"
import { SELECT_COLLECTION } from "../../lib/constants/action-types.js"
import {
    DEFAULT_IMAGE_OPTIONS,
    IMAGE_FORMATS,
    PAPER_SIZES,
    PDF_IMAGE_FORMAT
} from "../../lib/constants/image-export.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { exportCanvasImage } from "../../lib/utils/export-canvas-image.js"

/**
 * image and pdf export dialog.
 * @param {{ onClose: Function }} props onClose is called when the dialog should close
 * @returns {JSX.Element}
 */
function ImageExportDialog({ onClose }) {
    const { dispatch } = useModeler()
    const { getNodes } = useReactFlow()
    const [options, setOptions] = useState(DEFAULT_IMAGE_OPTIONS)
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)

    const selectedFormat = IMAGE_FORMATS.find((format) => format.id === options.format)

    // escape closes the dialog
    useEffect(() => {
        /** closes the dialog on escape */
        function handleKeyDown(event) {
            if (event.key === "Escape" && !isSaving) {
                onClose()
            }
        }

        document.addEventListener("keydown", handleKeyDown)

        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [onClose, isSaving])

    /** changes one option */
    function updateOption(changes) {
        setOptions({
            ...options,
            ...changes
        })
    }

    /** clears the selection, draws the diagram and saves the file */
    async function handleSave() {
        setIsSaving(true)
        setErrorMessage(null)

        // a selected card or thread is drawn highlighted, so clear the selection first
        dispatch({
            type: SELECT_COLLECTION,
            collectionId: null
        })

        const savedError = await exportCanvasImage(getNodes(), options)

        setIsSaving(false)

        if (savedError) {
            setErrorMessage(savedError)
            return
        }

        onClose()
    }

    return (
        <div
            className="dialog-backdrop"
            onMouseDown={(event) => event.target === event.currentTarget && !isSaving && onClose()}
        >
            <div
                className="dialog dialog-narrow"
                role="dialog"
                aria-modal="true"
                aria-label="Save as image or PDF"
            >
                {/* dialog header */}
                <div className="dialog-header">
                    <h2 className="dialog-title">Save as image or PDF</h2>
                    <button
                        type="button"
                        className="field-icon-button"
                        title="close (escape)"
                        disabled={isSaving}
                        onClick={onClose}
                    >
                        x
                    </button>
                </div>

                {/* file format */}
                <div className="dialog-formats">
                    {IMAGE_FORMATS.map((format) => (
                        <button
                            key={format.id}
                            type="button"
                            className={format.id === options.format ? "dialog-format dialog-format-active" : "dialog-format"}
                            onClick={() => updateOption({ format: format.id })}
                        >
                            {format.label}
                        </button>
                    ))}
                </div>

                <p className="inspector-hint">{selectedFormat.description}</p>

                {/* what to draw */}
                <div className="dialog-options dialog-options-column">
                    <label className="field-row-required">
                        <input
                            type="checkbox"
                            checked={options.showGrid}
                            onChange={(event) => updateOption({ showGrid: event.target.checked })}
                        />
                        grid dots in the background
                    </label>
                    <label className="field-row-required">
                        <input
                            type="checkbox"
                            checked={options.showShadows}
                            onChange={(event) => updateOption({ showShadows: event.target.checked })}
                        />
                        shadow under the collection cards
                    </label>
                </div>

                {/* paper size, pdf only */}
                {options.format === PDF_IMAGE_FORMAT && (
                    <label className="dialog-field">
                        paper
                        <select
                            className="field-row-select"
                            value={options.paper}
                            onChange={(event) => updateOption({ paper: event.target.value })}
                        >
                            {PAPER_SIZES.map((paper) => (
                                <option key={paper.id} value={paper.id}>
                                    {paper.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <p className="inspector-hint">
                    the file uses the current theme, pick Light in the toolbar first for a print with a white page
                </p>

                {/* error from the last try */}
                {errorMessage && <div className="relationship-warning">{errorMessage}</div>}

                {/* actions */}
                <div className="dialog-actions">
                    <button
                        type="button"
                        className="dialog-button"
                        disabled={isSaving}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="toolbar-button toolbar-button-primary"
                        disabled={isSaving}
                        onClick={handleSave}
                    >
                        {isSaving ? "Saving..." : `Save ${selectedFormat.id.toUpperCase()}`}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ImageExportDialog
