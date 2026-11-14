/**
 * one outgoing relationship of the selected collection, edited in place.
 * type, target collection, source field and cardinality can all change here.
 * changing the type, target or cardinality also reshapes the source field
 * (see lib/utils/relationship-operations.js).
 */
import {
    DELETE_RELATIONSHIP,
    UPDATE_RELATIONSHIP
} from "../../lib/constants/action-types.js"
import {
    CARDINALITIES,
    EMBED_RELATIONSHIP,
    REFERENCE_RELATIONSHIP,
    RELATIONSHIP_TYPES
} from "../../lib/constants/relationship-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { countFieldsInTree, findFieldById } from "../../lib/utils/field-tree.js"
import { flattenFieldPaths } from "../../lib/utils/field-paths.js"
import { formatFieldType } from "../../lib/utils/format-field-type.js"
import {
    getFieldCardinality,
    getRelationshipWarning
} from "../../lib/utils/relationship-rules.js"

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

    if (!sourceCollection || !targetCollection || !sourceField) {
        return null
    }

    // a collection cannot link to itself
    const targetOptions = collections.filter((collection) => collection.id !== sourceCollection.id)

    // the source field can be any field except _id and fields that already back another relationship
    const fieldsUsedElsewhere = new Set(
        relationships
            .filter((otherRelationship) => otherRelationship.id !== relationship.id)
            .map((otherRelationship) => otherRelationship.sourceFieldId)
    )
    const fieldOptions = flattenFieldPaths(sourceCollection.fields).filter(
        (option) => !option.field.isSystem && !fieldsUsedElsewhere.has(option.id)
    )

    const cardinality = getFieldCardinality(sourceField)
    const warningMessage = getRelationshipWarning(relationship, sourceField, targetCollection)
    const nestedFieldCount = countFieldsInTree(sourceField.children)

    /**
     * saves changes to this relationship.
     * @param {{ type?: string, sourceFieldId?: string, targetCollectionId?: string, cardinality?: string }} changes
     */
    function updateRelationship(changes) {
        dispatch({
            type: UPDATE_RELATIONSHIP,
            relationshipId: relationship.id,
            changes
        })
    }

    /** changes the type, asks first when turning an embed into a reference would remove nested fields */
    function handleTypeChange(event) {
        const newType = event.target.value
        const losesNestedFields =
            relationship.type === EMBED_RELATIONSHIP &&
            newType === REFERENCE_RELATIONSHIP &&
            nestedFieldCount > 0

        if (
            losesNestedFields &&
            !window.confirm(
                `this removes ${nestedFieldCount} nested ${nestedFieldCount === 1 ? "field" : "fields"}, continue?`
            )
        ) {
            return
        }

        updateRelationship({ type: newType })
    }

    /** deletes the relationship, the field that backed it stays in the collection */
    function handleDelete() {
        dispatch({
            type: DELETE_RELATIONSHIP,
            relationshipId: relationship.id
        })
    }

    return (
        <li className="relationship-row">
            {/* relationship type and target collection */}
            <div className="relationship-row-main">
                <select
                    className="field-row-select"
                    value={relationship.type}
                    onChange={handleTypeChange}
                    title="reference stores the _id of the other document, embed stores the document inside this one"
                >
                    {RELATIONSHIP_TYPES.map((relationshipType) => (
                        <option key={relationshipType} value={relationshipType}>
                            {relationshipType}
                        </option>
                    ))}
                </select>

                <span className="relationship-arrow">→</span>

                <select
                    className="field-row-select relationship-wide-select"
                    value={relationship.targetCollectionId}
                    onChange={(event) => updateRelationship({ targetCollectionId: event.target.value })}
                    title="target collection"
                >
                    {targetOptions.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                            {collection.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* source field, cardinality and delete button */}
            <div className="relationship-row-options">
                <select
                    className="field-row-select relationship-wide-select"
                    value={relationship.sourceFieldId}
                    onChange={(event) => updateRelationship({ sourceFieldId: event.target.value })}
                    title="field of this collection that holds the link"
                >
                    {fieldOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.path} ({formatFieldType(option.field)})
                        </option>
                    ))}
                </select>

                <select
                    className="field-row-select"
                    value={cardinality}
                    onChange={(event) => updateRelationship({ cardinality: event.target.value })}
                    title="one value or an array of values"
                >
                    {CARDINALITIES.map((cardinalityOption) => (
                        <option key={cardinalityOption} value={cardinalityOption}>
                            {cardinalityOption}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    className="field-icon-button"
                    title="delete relationship (the field stays)"
                    onClick={handleDelete}
                >
                    x
                </button>
            </div>

            {/* warning when the source field type no longer fits the relationship */}
            {warningMessage && <div className="relationship-warning">{warningMessage}</div>}
        </li>
    )
}

export default RelationshipRow
