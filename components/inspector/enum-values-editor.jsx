/**
 * editor for the enum list of a field: the values the field is allowed to hold.
 * values show as chips, type a value and press enter to add it (several values can be
 * typed at once, separated by commas), click a chip's x to remove it.
 */
import { useState } from "react"
import { validateEnumValue } from "../../lib/validators/field-options-validator.js"

/**
 * enum values editor.
 * @param {Object} props
 * @param {import("../../lib/models/factories.js").Field} props.field the field that owns the enum
 * @param {(enumValues: string[]) => void} props.onChange called with the new list after every add or remove
 * @returns {JSX.Element}
 */
function EnumValuesEditor({ field, onChange }) {
    const enumValues = field.options.enumValues
    const [draftText, setDraftText] = useState("")
    const [errorMessage, setErrorMessage] = useState(null)

    /** adds the typed values, nothing is added when one of them is not valid */
    function handleAdd() {
        const typedValues = draftText
            .split(",")
            .map((valueText) => valueText.trim())
            .filter((valueText) => valueText.length > 0)

        if (typedValues.length === 0) {
            setErrorMessage(null)
            return
        }

        const nextValues = [...enumValues]

        for (const typedValue of typedValues) {
            const valueError = validateEnumValue(field, typedValue, nextValues)

            if (valueError) {
                setErrorMessage(`${typedValue}: ${valueError}`)
                return
            }

            nextValues.push(typedValue)
        }

        setDraftText("")
        setErrorMessage(null)
        onChange(nextValues)
    }

    /** enter adds the typed values */
    function handleKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault()
            handleAdd()
        }
    }

    return (
        <div className="enum-editor">
            {/* the values that are allowed */}
            {enumValues.length > 0 && (
                <ul className="enum-chip-list">
                    {enumValues.map((enumValue) => (
                        <li key={enumValue} className="enum-chip">
                            {enumValue}
                            <button
                                type="button"
                                className="enum-chip-remove"
                                title={`remove ${enumValue}`}
                                onClick={() =>
                                    onChange(enumValues.filter((value) => value !== enumValue))
                                }
                            >
                                x
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* new value input */}
            <input
                className={
                    errorMessage
                        ? "validated-input-field validated-input-field-invalid"
                        : "validated-input-field"
                }
                value={draftText}
                placeholder="add allowed value, press enter"
                title="values this field may hold, separate several with commas"
                spellCheck={false}
                onChange={(event) => setDraftText(event.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleAdd}
            />

            {/* validation error */}
            {errorMessage && <div className="validated-input-error">{errorMessage}</div>}
        </div>
    )
}

export default EnumValuesEditor
