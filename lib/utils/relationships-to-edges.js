/**
 * converts project relationships into react flow edges.
 * an edge is a thread: it starts at the row of the field that holds the link and ends at
 * the row of the field it points at (for an embed, at the embedded card). there is no arrow head,
 * the direction is kept in the data and shown in the inspector.
 * threads are drawn as right angle lines with rounded corners (components/canvas/relationship-edge.jsx)
 * and are made easy to follow in a busy diagram:
 *  - the card sides are chosen from the real card positions and widths, and are chosen again
 *    while a card is dragged
 *  - threads are spread over a few lanes so they do not run on top of each other
 *  - while a collection or a thread is selected, the threads that do not belong to it fade out
 */
import {
    ACTIVE_EDGE_STROKE_WIDTH,
    DEFAULT_CARD_WIDTH,
    EDGE_LANE_COUNT,
    EDGE_LANE_SPACING,
    EDGE_MIN_SIDE_GAP,
    EDGE_STROKE_WIDTH,
    EDGE_STUB_LANE_STEP,
    EDGE_STUB_LENGTH,
    EMBED_EDGE_COLOR,
    REFERENCE_EDGE_COLOR,
    RELATIONSHIP_EDGE_TYPE,
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
 * picks the card sides an edge attaches to.
 * - the target is clearly to the right of the source (with room between the cards): the thread
 *   leaves the right side of the source and enters the left side of the target
 * - clearly to the left: the other way around
 * - the cards are stacked or overlap horizontally, or the link stays inside one card: both ends use
 *   the same side (the side the target lies towards), the thread makes a clean "C" around the cards
 * @param {{ x: number, width: number }} sourceRect left edge and width of the source card
 * @param {{ x: number, width: number }} targetRect left edge and width of the target card
 * @param {boolean} isSameCollection true when both ends are in the same card
 * @returns {{ source: "left" | "right", target: "left" | "right", gap: number }}
 *   gap is the free space between the facing sides in pixels, 0 when both ends use the same side
 */
export function chooseHandleSides(sourceRect, targetRect, isSameCollection) {
    if (isSameCollection) {
        return {
            source: RIGHT_SIDE,
            target: RIGHT_SIDE,
            gap: 0
        }
    }

    const gapToTheRight = targetRect.x - (sourceRect.x + sourceRect.width)
    const gapToTheLeft = sourceRect.x - (targetRect.x + targetRect.width)

    if (gapToTheRight >= EDGE_MIN_SIDE_GAP) {
        return {
            source: RIGHT_SIDE,
            target: LEFT_SIDE,
            gap: gapToTheRight
        }
    }

    if (gapToTheLeft >= EDGE_MIN_SIDE_GAP) {
        return {
            source: LEFT_SIDE,
            target: RIGHT_SIDE,
            gap: gapToTheLeft
        }
    }

    // stacked or overlapping cards, both ends on the side the target lies towards
    const sourceCenter = sourceRect.x + sourceRect.width / 2
    const targetCenter = targetRect.x + targetRect.width / 2
    const sharedSide = targetCenter >= sourceCenter ? RIGHT_SIDE : LEFT_SIDE

    return {
        source: sharedSide,
        target: sharedSide,
        gap: 0
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
 * finds where a card is: the live position and measured width from react flow when they are
 * known (so threads follow a card while it is dragged), otherwise the saved position.
 * @param {import("../models/factories.js").Collection} collection collection of the card
 * @param {Map<string, { x: number, width: number }>} cardRects live card positions and widths by collection id
 * @returns {{ x: number, width: number }}
 */
function getCardRect(collection, cardRects) {
    const liveRect = cardRects.get(collection.id)

    return {
        x: liveRect?.x ?? collection.position.x,
        width: liveRect?.width ?? DEFAULT_CARD_WIDTH
    }
}

/**
 * builds one react flow edge per relationship.
 * references are solid blue lines, embeds are dashed amber lines, a link whose two
 * fields have different types is red.
 * edges that touch the selected collection are drawn thicker, the selected thread thicker still,
 * and when a collection (that has threads) or a thread is selected, all other threads fade out.
 * relationships whose collections or fields are missing are skipped.
 * @param {import("../models/factories.js").Project} project project to draw
 * @param {string | null} selectedCollectionId id of the selected collection
 * @param {string | null} [selectedRelationshipId] id of the selected thread
 * @param {Map<string, { x: number, width: number }>} [cardRects] live card positions and widths by collection id
 * @returns {Array} react flow edges
 */
export function relationshipsToEdges(
    project,
    selectedCollectionId,
    selectedRelationshipId = null,
    cardRects = new Map()
) {
    // focus: a selected thread wins, else the threads of the selected collection
    const hasSelectedThread = project.relationships.some(
        (relationship) => relationship.id === selectedRelationshipId
    )
    const hasSelectedCollectionThreads = project.relationships.some(
        (relationship) =>
            relationship.sourceCollectionId === selectedCollectionId ||
            relationship.targetCollectionId === selectedCollectionId
    )

    let edgeNumber = 0

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
        let isDimmed = false

        if (hasSelectedThread) {
            isDimmed = !isSelected
        } else if (hasSelectedCollectionThreads) {
            isDimmed = !isActive
        }

        const handleSides = chooseHandleSides(
            getCardRect(sourceCollection, cardRects),
            getCardRect(targetCollection, cardRects),
            sourceCollection.id === targetCollection.id
        )

        // every thread gets a lane: lanes shift the vertical part of the thread sideways (inside
        // the free space between the cards) and lengthen the stub of threads that use the same side
        const lane = edgeNumber % EDGE_LANE_COUNT
        const widestShift = Math.max(0, handleSides.gap / 2 - 14)
        const laneShift = (lane - Math.floor(EDGE_LANE_COUNT / 2)) * EDGE_LANE_SPACING

        edgeNumber += 1

        return [
            {
                id: relationship.id,
                type: RELATIONSHIP_EDGE_TYPE,
                className: isDimmed ? "relationship-edge relationship-edge-dimmed" : "relationship-edge",
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
                },
                data: {
                    stubLength: EDGE_STUB_LENGTH + lane * EDGE_STUB_LANE_STEP,
                    channelShift: Math.max(-widestShift, Math.min(widestShift, laneShift))
                }
            }
        ]
    })
}
