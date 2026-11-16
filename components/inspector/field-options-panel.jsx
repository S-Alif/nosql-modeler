/**
 * panel with the extra options of one field, opened from the "options" button of the field row.
 * the options match what mongoose offers on a schema field: enum, min and max length, min and max,
 * a pattern, trim, lowercase and uppercase. a date field can also get a ttl (time to live),
 * mongodb then deletes the document a set time after the date in that field.
 * which options show depends on the type of the values the field holds (the item type for arrays),
 * see lib/utils/field-options.js.
 */
import { TTL_UNITS } from "../../lib/constants/field-options.js"
import { ARRAY_FIELD_TYPE } from "../../lib/constants/field-types.js"
import { getApplicableOptionKeys } from "../../lib/utils/field-options.js"
import { validateOption } from "../../lib/validators/field-options-validator.js"
import EnumValuesEditor from "./enum-values-editor.jsx"
import ValidatedTextInput from "./validated-text-input.jsx"

// labels, placeholders and tooltips of the text inputs, by option key
const OPTION_INPUTS = {
    minLength: {
        label: "min length",
        placeholder: "0",
        title: "shortest text allowed"
    },
    maxLength: {
        label: "max length",
        placeholder: "100",
        title: "longest text allowed"
    },
    min: {
        label: "min",
        placeholder: "no limit",
        title: "lowest value allowed (earliest date for date fields)"
    },
    max: {
        label: "max",
        placeholder: "no limit",
        title: "highest value allowed (latest date for date fields)"
    },
    match: {
        label: "pattern",
        placeholder: "^[a-z0-9_-]+$",
        title: "regular expression the text must match"
    }
}

/**
 * field options panel.
 * @param {Object} props
 * @param {import("../../lib/models/factories.js").Field} props.field the field to edit
 * @param {(optionChanges: object) => void} props.onChange called with the options that changed
 * @returns {JSX.Element}
 */
function FieldOptionsPanel({ field, onChange }) {
    const applicableKeys = getApplicableOptionKeys(field)
    const options = field.options

    /**
     * draws one text input option.
     * @param {string} optionKey key of the option
     * @returns {JSX.Element}
     */
    function renderOptionInput(optionKey) {
        const inputDetails = OPTION_INPUTS[optionKey]

        return (
            <label className="option-field" key={optionKey}>
                <span className="option-label">{inputDetails.label}</span>
                <ValidatedTextInput
                    value={options[optionKey]}
                    validate={(draftText) => validateOption(field, optionKey, draftText)}
                    onCommit={(newText) => onChange({ [optionKey]: newText })}
                    placeholder={inputDetails.placeholder}
                    title={inputDetails.title}
                />
            </label>
        )
    }

    return (
        <div className="field-options-panel">
            {/* arrays apply every option to each item */}
            {field.type === ARRAY_FIELD_TYPE && (
                <p className="option-hint">these options apply to each item of the array</p>
            )}

            {/* allowed values */}
            {applicableKeys.includes("enumValues") && (
                <div className="option-field">
                    <span className="option-label">enum, only these values are allowed</span>
                    <EnumValuesEditor
                        field={field}
                        onChange={(enumValues) => onChange({ enumValues })}
                    />
                </div>
            )}

            {/* length limits, min and max */}
            {(applicableKeys.includes("minLength") || applicableKeys.includes("min")) && (
                <div className="option-row">
                    {applicableKeys.includes("minLength") && renderOptionInput("minLength")}
                    {applicableKeys.includes("maxLength") && renderOptionInput("maxLength")}
                    {applicableKeys.includes("min") && renderOptionInput("min")}
                    {applicableKeys.includes("max") && renderOptionInput("max")}
                </div>
            )}

            {/* pattern */}
            {applicableKeys.includes("match") && renderOptionInput("match")}

            {/* text clean up, lower and upper case exclude each other */}
            {applicableKeys.includes("trim") && (
                <div className="option-row">
                    <label className="option-check">
                        <input
                            type="checkbox"
                            checked={options.trim}
                            onChange={(event) => onChange({ trim: event.target.checked })}
                        />
                        trim spaces
                    </label>
                    <label className="option-check">
                        <input
                            type="checkbox"
                            checked={options.lowercase}
                            onChange={(event) =>
                                onChange({
                                    lowercase: event.target.checked,
                                    uppercase: event.target.checked ? false : options.uppercase
                                })
                            }
                        />
                        lowercase
                    </label>
                    <label className="option-check">
                        <input
                            type="checkbox"
                            checked={options.uppercase}
                            onChange={(event) =>
                                onChange({
                                    uppercase: event.target.checked,
                                    lowercase: event.target.checked ? false : options.lowercase
                                })
                            }
                        />
                        uppercase
                    </label>
                </div>
            )}

            {/* time to live, date fields only */}
            {applicableKeys.includes("ttlValue") && (
                <div className="option-field">
                    <span className="option-label">ttl, delete the document after</span>
                    <div className="option-row">
                        <ValidatedTextInput
                            value={options.ttlValue}
                            validate={(draftText) => validateOption(field, "ttlValue", draftText)}
                            onCommit={(newText) => onChange({ ttlValue: newText })}
                            placeholder="no ttl"
                            title="leave empty for no ttl, 0 deletes the document as soon as the date has passed"
                        />
                        <select
                            className="field-row-select"
                            value={options.ttlUnit}
                            onChange={(event) => onChange({ ttlUnit: event.target.value })}
                            title="unit of the ttl"
                        >
                            {TTL_UNITS.map((unit) => (
                                <option key={unit.name} value={unit.name}>
                                    {unit.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="option-hint">
                        mongodb deletes the document this long after the date stored in this field.
                        it checks about once a minute, so the deletion is not exact.
                    </p>
                </div>
            )}
        </div>
    )
}

export default FieldOptionsPanel
