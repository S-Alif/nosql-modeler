/**
 * text input that checks its value while the user types.
 * the draft is only committed when the input loses focus (or enter is pressed)
 * and the value is valid. escape or an invalid value restores the saved value.
 */
import { useEffect, useRef, useState } from "react"

/**
 * validated text input.
 * @param {Object} props
 * @param {string} props.value saved value
 * @param {(draftValue: string) => string | null} props.validate returns an error message, or null when valid
 * @param {(committedValue: string) => void} props.onCommit called with the trimmed value when it changed
 * @param {string} [props.placeholder] placeholder text
 * @param {string} [props.title] tooltip text
 * @returns {JSX.Element}
 */
function ValidatedTextInput({ value, validate, onCommit, placeholder, title }) {
    const [draftValue, setDraftValue] = useState(value)

    // set by escape so the blur that follows restores the value instead of saving the draft
    const wasCancelledRef = useRef(false)

    const errorMessage = validate(draftValue)

    // follow changes of the saved value that came from outside
    useEffect(() => {
        setDraftValue(value)
    }, [value])

    /** saves a valid draft, restores the saved value otherwise */
    function handleBlur() {
        if (wasCancelledRef.current || errorMessage) {
            wasCancelledRef.current = false
            setDraftValue(value)
            return
        }

        const committedValue = draftValue.trim()

        setDraftValue(committedValue)

        if (committedValue !== value) {
            onCommit(committedValue)
        }
    }

    /** enter saves, escape cancels */
    function handleKeyDown(event) {
        if (event.key === "Enter") {
            event.currentTarget.blur()
        } else if (event.key === "Escape") {
            wasCancelledRef.current = true
            event.currentTarget.blur()
        }
    }

    return (
        <div className="validated-input">
            {/* text input */}
            <input
                className={
                    errorMessage
                        ? "validated-input-field validated-input-field-invalid"
                        : "validated-input-field"
                }
                value={draftValue}
                placeholder={placeholder}
                title={title}
                spellCheck={false}
                onChange={(event) => setDraftValue(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />

            {/* validation error */}
            {errorMessage && <div className="validated-input-error">{errorMessage}</div>}
        </div>
    )
}

export default ValidatedTextInput
