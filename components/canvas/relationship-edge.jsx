/**
 * custom react flow edge for relationship threads.
 * a thread is drawn with right angles and rounded corners: out of a card by a short stub, along
 * one vertical run, and into the other card. the vertical run of every thread sits in its own
 * lane (data.channelShift), so threads between the same two columns of cards do not run on
 * top of each other and can be told apart.
 * the line style (color, width, dashes) and the fade-out class come from relationships-to-edges.js.
 */
import { BaseEdge, getSmoothStepPath } from "@xyflow/react"
import { EDGE_BORDER_RADIUS } from "../../lib/constants/canvas-config.js"

// how wide the invisible area around a thread is that reacts to the mouse, in pixels
const EDGE_CLICK_WIDTH = 18

/**
 * relationship thread.
 * @param {Object} props props passed in by react flow
 * @param {string} props.id edge id
 * @param {number} props.sourceX x of the source handle
 * @param {number} props.sourceY y of the source handle
 * @param {number} props.targetX x of the target handle
 * @param {number} props.targetY y of the target handle
 * @param {string} props.sourcePosition side of the source handle ("left" or "right")
 * @param {string} props.targetPosition side of the target handle ("left" or "right")
 * @param {object} props.style line style set in relationships-to-edges.js
 * @param {{ stubLength: number, channelShift: number }} props.data lane settings of this thread
 * @returns {JSX.Element}
 */
function RelationshipEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    data
}) {
    // facing sides: the vertical run sits halfway between the cards, moved into its lane
    // same side: the run sits beyond the cards and the stub length decides how far
    const hasFacingSides = sourcePosition !== targetPosition
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: EDGE_BORDER_RADIUS,
        offset: data.stubLength,
        centerX: hasFacingSides ? (sourceX + targetX) / 2 + data.channelShift : undefined
    })

    return (
        <BaseEdge
            id={id}
            path={edgePath}
            style={style}
            interactionWidth={EDGE_CLICK_WIDTH}
        />
    )
}

export default RelationshipEdge
