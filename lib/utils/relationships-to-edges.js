/**
 * converts project relationships into react flow edges.
 * a reference edge runs from the field that holds the link to the field it points at,
 * an embed edge runs from the embedding field to the embedded card.
 */
import {
    ACTIVE_EDGE_STROKE_WIDTH,
    EDGE_ARROW_MARKER_TYPE,
    EDGE_STROKE_WIDTH,
    EMBED_EDGE_COLOR,
    REFERENCE_EDGE_COLOR,
    RELATIONSHIP_EDGE_TYPE,
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
import { getEdgeBadges, getRelationshipWarning } from "./relationship-rules.js"

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
 * builds one react flow edge per relationship.
 * references are solid blue lines, embeds are dashed amber lines, a link whose two
 * fields have different types is red. every edge ends in an arrow on the target and
 * carries the 1 and N marks of its two ends (see getEdgeBadges).
 * edges that touch the selected collection are drawn thicker.
 * relationships whose collections or fields are missing are skipped.
 * @param {import("../models/factories.js").Project} project project to draw
 * @param {string | null} selectedCollectionId id of the selected collection
 * @returns {Array} react flow edges
 */
export function relationshipsToEdges(project, selectedCollectionId) {
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
        const handleSides = chooseHandleSides(
            sourceCollection.position,
            targetCollection.position,
            sourceCollection.id === targetCollection.id
        )
        const badges = getEdgeBadges(relationship, sourceField)

        return [
            {
                id: relationship.id,
                type: RELATIONSHIP_EDGE_TYPE,
                source: sourceCollection.id,
                target: targetCollection.id,
                sourceHandle: buildFieldHandleId(sourceField.id, handleSides.source),
                targetHandle: isEmbed
                    ? buildCardHandleId(handleSides.target)
                    : buildFieldHandleId(targetField.id, handleSides.target),
                markerEnd: {
                    type: EDGE_ARROW_MARKER_TYPE,
                    color: edgeColor
                },
                style: {
                    stroke: edgeColor,
                    strokeWidth: isActive ? ACTIVE_EDGE_STROKE_WIDTH : EDGE_STROKE_WIDTH,
                    strokeDasharray: isEmbed ? "6 4" : "none"
                },
                data: {
                    color: edgeColor,
                    sourceBadge: badges.source,
                    targetBadge: badges.target
                }
            }
        ]
    })
}
