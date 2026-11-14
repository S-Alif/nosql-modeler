/**
 * converts project relationships into react flow edges.
 */
import {
    ACTIVE_EDGE_STROKE_WIDTH,
    EDGE_ARROW_MARKER_TYPE,
    EDGE_STROKE_WIDTH,
    EMBED_EDGE_COLOR,
    REFERENCE_EDGE_COLOR
} from "../constants/canvas-config.js"
import { CARDINALITY_MANY, EMBED_RELATIONSHIP } from "../constants/relationship-types.js"
import { findFieldById } from "./field-tree.js"
import { getFieldPath } from "./field-paths.js"
import { getFieldCardinality } from "./relationship-rules.js"

/**
 * picks the sides of two cards an edge should attach to, so it leaves the
 * source on the side that faces the target.
 * the decision uses the card positions only (the top left corners).
 * @param {{ x: number, y: number }} sourcePosition position of the source card
 * @param {{ x: number, y: number }} targetPosition position of the target card
 * @returns {{ source: string, target: string }} side names: "top", "right", "bottom" or "left"
 */
export function chooseHandleSides(sourcePosition, targetPosition) {
    const deltaX = targetPosition.x - sourcePosition.x
    const deltaY = targetPosition.y - sourcePosition.y

    // the target is mostly to the right or left of the source
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        if (deltaX >= 0) {
            return {
                source: "right",
                target: "left"
            }
        }

        return {
            source: "left",
            target: "right"
        }
    }

    // the target is mostly below or above the source
    if (deltaY >= 0) {
        return {
            source: "bottom",
            target: "top"
        }
    }

    return {
        source: "top",
        target: "bottom"
    }
}

/**
 * builds one react flow edge per relationship.
 * references are solid blue lines, embeds are dashed amber lines, both end in an arrow
 * and show the source field path and the cardinality, for example "userId (ref 1)".
 * edges that touch the selected collection are drawn thicker.
 * relationships whose collections or field are missing are skipped.
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

        // self links are not supported, they are removed everywhere else too
        if (
            !sourceCollection ||
            !targetCollection ||
            !sourceField ||
            sourceCollection.id === targetCollection.id
        ) {
            return []
        }

        const isEmbed = relationship.type === EMBED_RELATIONSHIP
        const edgeColor = isEmbed ? EMBED_EDGE_COLOR : REFERENCE_EDGE_COLOR
        const isActive =
            relationship.sourceCollectionId === selectedCollectionId ||
            relationship.targetCollectionId === selectedCollectionId
        const handleSides = chooseHandleSides(sourceCollection.position, targetCollection.position)
        const cardinalityLabel =
            getFieldCardinality(sourceField) === CARDINALITY_MANY ? "N" : "1"
        const typeLabel = isEmbed ? "embed" : "ref"
        const fieldPath = getFieldPath(sourceCollection.fields, sourceField.id)

        return [
            {
                id: relationship.id,
                source: sourceCollection.id,
                target: targetCollection.id,
                sourceHandle: `${handleSides.source}-source`,
                targetHandle: `${handleSides.target}-target`,
                label: `${fieldPath} (${typeLabel} ${cardinalityLabel})`,
                markerEnd: {
                    type: EDGE_ARROW_MARKER_TYPE,
                    color: edgeColor
                },
                style: {
                    stroke: edgeColor,
                    strokeWidth: isActive ? ACTIVE_EDGE_STROKE_WIDTH : EDGE_STROKE_WIDTH,
                    strokeDasharray: isEmbed ? "6 4" : "none"
                },
                labelStyle: {
                    fill: "var(--color-text)",
                    fontSize: 11
                },
                labelBgStyle: { fill: "var(--color-surface)" },
                labelBgPadding: [6, 3],
                labelBgBorderRadius: 4
            }
        ]
    })
}
