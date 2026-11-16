/**
 * converts project relationships into react flow edges.
 * an edge is a plain thread: it starts at the row of the field that holds the link and ends at
 * the row of the field it points at (for an embed, at the embedded card). there is no arrow head,
 * the direction is kept in the data and shown in the inspector.
 */
import {
    ACTIVE_EDGE_STROKE_WIDTH,
    EDGE_STROKE_WIDTH,
    EMBED_EDGE_COLOR,
    REFERENCE_EDGE_COLOR,
    SELECTED_EDGE_STROKE_WIDTH,
    WARNING_EDGE_COLOR
} from "../constants/canvas-config.js"
import { EMBED_RELATIONSHIP } from "../constants/relationship-types.js"
import { findFieldById } from "./field-tree.js"
import {
    LEFT_SIDE,
    RIGHT_SIDE,
    buildCardHandleId,
    buildFieldHandleId
} from "./handle-ids.js"
import { getRelationshipWarning } from "./relationship-rules.js"

/**
 * picks the card sides an edge attaches to, so it leaves the source on the side
 * that faces the target. field rows only have a left and a right handle,
 * so only the horizontal position matters (the top left corners are compared).
 * a link inside one card leaves and enters on the right side.
 * @param {{ x: number, y: number }} sourcePosition position of the source card
 * @param {{ x: number, y: number }} targetPosition position of the target card
 * @param {boolean} isSameCollection true when both ends are in the same card
 * @returns {{ source: "left" | "right", target: "left" | "right" }}
 */
export function chooseHandleSides(sourcePosition, targetPosition, isSameCollection) {
    if (isSameCollection) {
        return {
            source: RIGHT_SIDE,
            target: RIGHT_SIDE
        }
    }

    // the target is to the right of the source
    if (targetPosition.x >= sourcePosition.x) {
        return {
            source: RIGHT_SIDE,
            target: LEFT_SIDE
        }
    }

    return {
        source: LEFT_SIDE,
        target: RIGHT_SIDE
    }
}

/**
 * picks the line width of an edge.
 * @param {boolean} isSelected true for the selected thread
 * @param {boolean} isActive true when the edge touches the selected collection
 * @returns {number}
 */
function getStrokeWidth(isSelected, isActive) {
    if (isSelected) {
        return SELECTED_EDGE_STROKE_WIDTH
    }

    return isActive ? ACTIVE_EDGE_STROKE_WIDTH : EDGE_STROKE_WIDTH
}

/**
 * builds one react flow edge per relationship.
 * references are solid blue lines, embeds are dashed amber lines, a link whose two
 * fields have different types is red.
 * edges that touch the selected collection are drawn thicker, the selected thread thicker still.
 * relationships whose collections or fields are missing are skipped.
 * @param {import("../models/factories.js").Project} project project to draw
 * @param {string | null} selectedCollectionId id of the selected collection
 * @param {string | null} [selectedRelationshipId] id of the selected thread
 * @returns {Array} react flow edges
 */
export function relationshipsToEdges(project, selectedCollectionId, selectedRelationshipId = null) {
    return project.relationships.flatMap((relationship) => {
        const sourceCollection = project.collections.find(
            (collection) => collection.id === relationship.sourceCollectionId
        )
        const targetCollection = project.collections.find(
            (collection) => collection.id === relationship.targetCollectionId
        )
        const sourceField = sourceCollection
            ? findFieldById(sourceCollection.fields, relationship.sourceFieldId)
            : null
        const isEmbed = relationship.type === EMBED_RELATIONSHIP
        const targetField =
            targetCollection && relationship.targetFieldId
                ? findFieldById(targetCollection.fields, relationship.targetFieldId)
                : null

        // a reference needs both fields, an embed only needs the source field
        if (!sourceCollection || !targetCollection || !sourceField || (!isEmbed && !targetField)) {
            return []
        }

        const hasWarning = getRelationshipWarning(relationship, sourceField, targetField) !== null
        let edgeColor = isEmbed ? EMBED_EDGE_COLOR : REFERENCE_EDGE_COLOR

        if (hasWarning && !isEmbed) {
            edgeColor = WARNING_EDGE_COLOR
        }

        const isActive =
            relationship.sourceCollectionId === selectedCollectionId ||
            relationship.targetCollectionId === selectedCollectionId
        const isSelected = relationship.id === selectedRelationshipId
        const handleSides = chooseHandleSides(
            sourceCollection.position,
            targetCollection.position,
            sourceCollection.id === targetCollection.id
        )

        return [
            {
                id: relationship.id,
                selected: isSelected,
                source: sourceCollection.id,
                target: targetCollection.id,
                sourceHandle: buildFieldHandleId(sourceField.id, handleSides.source),
                targetHandle: isEmbed
                    ? buildCardHandleId(handleSides.target)
                    : buildFieldHandleId(targetField.id, handleSides.target),
                style: {
                    stroke: edgeColor,
                    strokeWidth: getStrokeWidth(isSelected, isActive),
                    strokeDasharray: isEmbed ? "6 4" : "none"
                }
            }
        ]
    })
}
