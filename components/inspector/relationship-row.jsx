/**
 * one outgoing relationship of the selected collection, edited in place.
 * a relationship connects two existing fields: the field of this collection that holds
 * the link (source) and the field it points at (target). the type, both fields and the
 * target collection can change here, the fields themselves are never changed,
 * a warning shows when their types do not fit. edit the fields in the field list.
 */
import {
    DELETE_RELATIONSHIP,
    UPDATE_RELATIONSHIP
} from "../../lib/constants/action-types.js"
import {
    EMBED_RELATIONSHIP,
    RELATIONSHIP_TYPES
} from "../../lib/constants/relationship-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { findFieldById } from "../../lib/utils/field-tree.js"
import { flattenFieldPaths } from "../../lib/utils/field-paths.js"
import { formatFieldType } from "../../lib/utils/format-field-type.js"
import { getRelationshipWarning } from "../../lib/utils/relationship-rules.js"

/**
 * relationship row.
 * @param {{ relationship: import("../../lib/models/factories.js").Relationship }} props
 * @returns {JSX.Element | null} null when the relationship points at something that no longer exists
 */
function RelationshipRow({ relationship }) {
    const { state, dispatch } = useModeler()
    const { collections, relationships } = state.project

    const sourceCollection = collections.find(
        (collection) => collection.id === relationship.sourceCollectionId
    )
    const targetCollection = collections.find(
        (collection) => collection.id === relationship.targetCollectionId
    )
    const sourceField = sourceCollection
        ? findFieldById(sourceCollection.fields, relationship.sourceFieldId)
        : null
    const targetField =
        targetCollection && relationship.targetFieldId
            ? findFieldById(targetCollection.fields, relationship.targetFieldId)
            : null
    const isEmbed = relationship.type === EMBED_RELATIONSHIP

    if (!sourceCollection || !targetCollection || !sourceField || (!isEmbed && !targetField)) {
        return null
    }

    // the source field can be any field except _id and fields that already back another relationship
    const fieldsUsedElsewhere = new Set(
        relationships
            .filter((otherRelationship) => otherRelationship.id !== relationship.id)
            .map((otherRelationship) => otherRelationship.sourceFieldId)
    )
    const sourceFieldOptions = flattenFieldPaths(sourceCollection.fields).filter(
        (option) => !option.field.isSystem && !fieldsUsedElsewhere.has(option.id)
    )

    // the target field can be any field of the target collection except the source field itself
    const targetFieldOptions = flattenFieldPaths(targetCollection.fields).filter(
        (option) => option.id !== sourceField.id
    )

    const warningMessage = getRelationshipWarning(relationship, sourceField, targetField)

    /**
     * saves changes to this relationship.
     * @param {{ type?: string, sourceFieldId?: string, targetCollectionId?: string, targetFieldId?: string | null }} changes
     */
    function updateRelationship(changes) {
        dispatch({
            type: UPDATE_RELATIONSHIP,
            relationshipId: relationship.id,
            changes
        })
    }

    /** deletes the relationship, both fields stay in their collections */
    function handleDelete() {
        dispatch({
            type: DELETE_RELATIONSHIP,
            relationshipId: relationship.id
        })
    }

    return (
        <li className="relationship-row">
            {/* source field, relationship type and delete button */}
            <div className="relationship-row-main">
                <select
                    className="field-row-select relationship-wide-select"
                    value={relationship.sourceFieldId}
                    onChange={(event) => updateRelationship({ sourceFieldId: event.target.value })}
                    title="field of this collection that holds the link"
                >
                    {sourceFieldOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.path} ({formatFieldType(option.field)})
                        </option>
                    ))}
                </select>

                <select
                    className="field-row-select"
                    value={relationship.type}
                    onChange={(event) => updateRelationship({ type: event.target.value })}
                    title="reference stores the value of the other field, embed stores the other document inside this field"
                >
                    {RELATIONSHIP_TYPES.map((relationshipType) => (
                        <option key={relationshipType} value={relationshipType}>
                            {relationshipType}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="field-icon-button"
                    title="delete relationship (both fields stay)"
                    onClick={handleDelete}
                >
                    x
                </button>
            </div>

            {/* target collection and target field */}
            <div className="relationship-row-options">
                <span className="relationship-arrow">→</span>

                <select
                    className="field-row-select relationship-wide-select"
                    value={relationship.targetCollectionId}
                    onChange={(event) => updateRelationship({ targetCollectionId: event.target.value })}
                    title="collection this field points at"
                >
                    {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                            {collection.name}
                        </option>
                    ))}
                </select>

                {isEmbed ? (
                    <span className="relationship-whole-document">whole document</span>
                ) : (
                    <select
                        className="field-row-select relationship-wide-select"
                        value={relationship.targetFieldId}
                        onChange={(event) => updateRelationship({ targetFieldId: event.target.value })}
                        title="field this field points at, usually _id"
                    >
                        {targetFieldOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.path} ({formatFieldType(option.field)})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* warning when the two fields do not fit together */}
            {warningMessage && <div className="relationship-warning">{warningMessage}</div>}
        </li>
    )
}

export default RelationshipRow
