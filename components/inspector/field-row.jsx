/**
 * one field row of the inspector. nested fields are drawn by this same
 * component again, so objects and arrays of objects can nest as deep as needed.
 * the automatic _id field is a system field: its name, required flag, position
 * and existence are locked, only its type can change.
 */
import { useState } from "react"
import {
    ADD_FIELD,
    DELETE_FIELD,
    MOVE_FIELD,
    UPDATE_FIELD
} from "../../lib/constants/action-types.js"
import {
    ARRAY_FIELD_TYPE,
    ARRAY_ITEM_TYPES,
    FIELD_TYPES,
    ID_FIELD_TYPES,
    OBJECT_FIELD_TYPE,
    TYPES_WITH_DEFAULT_VALUE
} from "../../lib/constants/field-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { countActiveOptions, getApplicableOptionKeys, getOptionsAfterTypeChange } from "../../lib/utils/field-options.js"
import { getFieldPath } from "../../lib/utils/field-paths.js"
import { countFieldsInTree, hasChildFields } from "../../lib/utils/field-tree.js"
import { validateDefaultValue } from "../../lib/validators/default-value-validator.js"
import { validateFieldName } from "../../lib/validators/field-name-validator.js"
import { getDefaultValueConflict } from "../../lib/validators/field-options-validator.js"
import FieldOptionsPanel from "./field-options-panel.jsx"
import ValidatedTextInput from "./validated-text-input.jsx"

// tooltip that explains the naming convention
const FIELD_NAME_HINT = "letters, numbers and underscores only, use camelCase or snake_case"

/** validator for inputs that accept any text, like the description */
function acceptAnyText() {
    return null
}

/**
 * field row.
 * @param {Object} props
 * @param {string} props.collectionId id of the collection the field belongs to
 * @param {import("../../lib/models/factories.js").Field} props.field the field to edit
 * @param {import("../../lib/models/factories.js").Field[]} props.siblingFields all fields at the same level, this one included
 * @param {string | null} props.parentFieldId id of the parent field, null for top level fields
 * @returns {JSX.Element}
 */
function FieldRow({ collectionId, field, siblingFields, parentFieldId }) {
    const { state, dispatch } = useModeler()

    // whether the options panel (enum, limits, pattern, ttl) is open
    const [isOptionsOpen, setIsOptionsOpen] = useState(false)

    // the relationship this field backs, shown as a small link note under the field
    const linkedRelationship = state.project.relationships.find(
        (relationship) => relationship.sourceFieldId === field.id
    )
    const linkedTargetCollection = linkedRelationship
        ? state.project.collections.find(
            (collection) => collection.id === linkedRelationship.targetCollectionId
        )
        : undefined
    const linkedTargetFieldPath =
        linkedTargetCollection && linkedRelationship.targetFieldId
            ? getFieldPath(linkedTargetCollection.fields, linkedRelationship.targetFieldId)
            : null

    const isSystemField = Boolean(field.isSystem)
    const siblingNames = siblingFields
        .filter((siblingField) => siblingField.id !== field.id)
        .map((siblingField) => siblingField.name)
    const fieldIndex = siblingFields.findIndex((siblingField) => siblingField.id === field.id)
    const previousField = siblingFields[fieldIndex - 1]
    const isMoveUpBlocked = fieldIndex === 0 || isSystemField || Boolean(previousField?.isSystem)
    const isMoveDownBlocked = fieldIndex === siblingFields.length - 1 || isSystemField
    const typeOptions = isSystemField ? ID_FIELD_TYPES : FIELD_TYPES
    const canHaveChildren = hasChildFields(field)
    const supportsDefaultValue = !isSystemField && TYPES_WITH_DEFAULT_VALUE.includes(field.type)
    const nestedFieldCount = countFieldsInTree(field.children)
    const hasOptions = getApplicableOptionKeys(field).length > 0
    const activeOptionCount = countActiveOptions(field)
    const defaultValueConflict = getDefaultValueConflict(field)

    /**
     * saves changes to this field.
     * @param {Partial<import("../../lib/models/factories.js").Field>} changes properties to overwrite
     */
    function updateField(changes) {
        dispatch({
            type: UPDATE_FIELD,
            collectionId,
            fieldId: field.id,
            changes
        })
    }

    /**
     * asks before nested fields are thrown away.
     * @returns {boolean} true when there is nothing to lose or the user agreed
     */
    function confirmRemovingNestedFields() {
        if (nestedFieldCount === 0) {
            return true
        }

        return window.confirm(
            `this removes ${nestedFieldCount} nested ${nestedFieldCount === 1 ? "field" : "fields"}, continue?`
        )
    }

    /**
     * saves a change of the options, the other options stay.
     * @param {object} optionChanges the options that changed
     */
    function updateOptions(optionChanges) {
        updateField({
            options: {
                ...field.options,
                ...optionChanges
            }
        })
    }

    /** changes the type, the default value is cleared because it may not fit the new type, options are kept only when they still fit */
    function handleTypeChange(event) {
        const newType = event.target.value
        const keepsChildren =
            newType === OBJECT_FIELD_TYPE ||
            (newType === ARRAY_FIELD_TYPE && field.itemType === OBJECT_FIELD_TYPE)

        if (!keepsChildren && !confirmRemovingNestedFields()) {
            return
        }

        updateField({
            type: newType,
            defaultValue: "",
            options: getOptionsAfterTypeChange(field, { type: newType })
        })
    }

    /** changes the type of the array items */
    function handleItemTypeChange(event) {
        const newItemType = event.target.value

        if (newItemType !== OBJECT_FIELD_TYPE && !confirmRemovingNestedFields()) {
            return
        }

        updateField({
            itemType: newItemType,
            options: getOptionsAfterTypeChange(field, { itemType: newItemType })
        })
    }

    /** deletes this field, asks first when it has nested fields */
    function handleDelete() {
        const isConfirmed =
            nestedFieldCount === 0 ||
            window.confirm(`delete "${field.name}" and its ${nestedFieldCount} nested fields?`)

        if (isConfirmed) {
            dispatch({
                type: DELETE_FIELD,
                collectionId,
                fieldId: field.id
            })
        }
    }

    /** moves this field up (-1) or down (1) among its siblings */
    function handleMove(direction) {
        dispatch({
            type: MOVE_FIELD,
            collectionId,
            fieldId: field.id,
            direction
        })
    }

    /** adds a field inside this object field */
    function handleAddChild() {
        dispatch({
            type: ADD_FIELD,
            collectionId,
            parentFieldId: field.id
        })
    }

    return (
        <li className="field-row">
            {/* field main line: name, type and array item type */}
            <div className="field-row-main">
                {/* the _id name is fixed, every other name is editable */}
                {isSystemField ? (
                    <div
                        className="field-row-system-name"
                        title="added automatically to every collection"
                    >
                        {field.name}
                        <span className="field-row-system-badge">auto</span>
                    </div>
                ) : (
                    <ValidatedTextInput
                        value={field.name}
                        validate={(draftName) => validateFieldName(draftName, siblingNames)}
                        onCommit={(newName) => updateField({ name: newName })}
                        placeholder="field name"
                        title={FIELD_NAME_HINT}
                    />
                )}

                <select
                    className="field-row-select"
                    value={field.type}
                    onChange={handleTypeChange}
                >
                    {typeOptions.map((fieldType) => (
                        <option key={fieldType} value={fieldType}>
                            {fieldType}
                        </option>
                    ))}
                </select>

                {/* array item type */}
                {field.type === ARRAY_FIELD_TYPE && (
                    <select
                        className="field-row-select"
                        value={field.itemType}
                        onChange={handleItemTypeChange}
                        title="type of the array items"
                    >
                        {ARRAY_ITEM_TYPES.map((itemType) => (
                            <option key={itemType} value={itemType}>
                                {itemType}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* field options line: required, default value and actions */}
            <div className="field-row-options">
                {/* required checkbox, always on and locked for the _id field */}
                <label className="field-row-required">
                    <input
                        type="checkbox"
                        checked={field.required}
                        disabled={isSystemField}
                        onChange={(event) => updateField({ required: event.target.checked })}
                    />
                    required
                </label>

                {/* default value, a select for booleans and a text input for the rest */}
                {supportsDefaultValue && field.type === "boolean" && (
                    <select
                        className="field-row-select"
                        value={field.defaultValue}
                        onChange={(event) => updateField({ defaultValue: event.target.value })}
                        title="default value"
                    >
                        <option value="">no default</option>
                        <option value="true">true</option>
                        <option value="false">false</option>
                    </select>
                )}

                {supportsDefaultValue && field.type !== "boolean" && (
                    <ValidatedTextInput
                        value={field.defaultValue}
                        validate={(draftText) => validateDefaultValue(field.type, draftText)}
                        onCommit={(newDefaultValue) =>
                            updateField({ defaultValue: newDefaultValue })
                        }
                        placeholder="default value"
                        title="default value"
                    />
                )}

                {/* options button, enum, limits, pattern and ttl live in the panel below */}
                {hasOptions && (
                    <button
                        type="button"
                        className={
                            isOptionsOpen
                                ? "field-options-toggle field-options-toggle-open"
                                : "field-options-toggle"
                        }
                        title="enum, length, min and max, pattern, ttl"
                        onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                    >
                        options{activeOptionCount > 0 ? ` (${activeOptionCount})` : ""}
                    </button>
                )}

                {/* move and delete buttons */}
                <div className="field-row-actions">
                    <button
                        type="button"
                        className="field-icon-button"
                        title="move up"
                        disabled={isMoveUpBlocked}
                        onClick={() => handleMove(-1)}
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        className="field-icon-button"
                        title="move down"
                        disabled={isMoveDownBlocked}
                        onClick={() => handleMove(1)}
                    >
                        ↓
                    </button>

                    {/* the _id field cannot be deleted */}
                    {!isSystemField && (
                        <button
                            type="button"
                            className="field-icon-button"
                            title="delete field"
                            onClick={handleDelete}
                        >
                            x
                        </button>
                    )}
                </div>
            </div>

            {/* warning when the default value breaks the options of this field */}
            {defaultValueConflict && <div className="field-row-warning">{defaultValueConflict}</div>}

            {/* options panel */}
            {hasOptions && isOptionsOpen && (
                <FieldOptionsPanel
                    field={field}
                    onChange={updateOptions}
                />
            )}

            {/* field description */}
            <div className="field-row-description">
                <ValidatedTextInput
                    value={field.description ?? ""}
                    validate={acceptAnyText}
                    onCommit={(newDescription) => updateField({ description: newDescription })}
                    placeholder="description (optional)"
                    title="what this field is for"
                />
            </div>

            {/* relationship note, edit the relationship in the section below the fields */}
            {linkedRelationship && (
                <div className="field-row-link">
                    {linkedRelationship.type} → {linkedTargetCollection?.name}
                    {linkedTargetFieldPath ? `.${linkedTargetFieldPath}` : ""}
                </div>
            )}

            {/* nested fields (object fields and arrays of objects) */}
            {canHaveChildren && (
                <div className="field-row-children">
                    <ul className="field-list">
                        {field.children.map((childField) => (
                            <FieldRow
                                key={childField.id}
                                collectionId={collectionId}
                                field={childField}
                                siblingFields={field.children}
                                parentFieldId={field.id}
                            />
                        ))}
                    </ul>

                    <button
                        type="button"
                        className="field-add-button"
                        onClick={handleAddChild}
                    >
                        + add nested field
                    </button>
                </div>
            )}
        </li>
    )
}

export default FieldRow
