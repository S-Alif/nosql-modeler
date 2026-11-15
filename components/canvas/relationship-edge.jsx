/**
 * custom react flow edge for relationships.
 * draws the curve with an arrow on the target end, and a small "1" or "N" mark next to
 * each end, so the direction and the cardinality can be read straight off the canvas:
 * N at the field that holds the link, 1 at the field it points at (N on both ends
 * when the holding field is an array).
 */
import {
    BaseEdge,
    EdgeLabelRenderer,
    Position,
    getBezierPath
} from "@xyflow/react"
import { EDGE_BADGE_OFFSET } from "../../lib/constants/canvas-config.js"

/**
 * works out where a mark sits: just outside the card, a little above the line.
 * @param {number} pointX x of the edge end
 * @param {number} pointY y of the edge end
 * @param {string} position side the edge leaves the card on ("left" or "right")
 * @returns {{ x: number, y: number }}
 */
function getBadgePosition(pointX, pointY, position) {
    return {
        x: position === Position.Left ? pointX - EDGE_BADGE_OFFSET : pointX + EDGE_BADGE_OFFSET,
        y: pointY - 12
    }
}

/**
 * relationship edge.
 * @param {Object} props props passed in by react flow
 * @param {string} props.id edge id
 * @param {number} props.sourceX x of the source handle
 * @param {number} props.sourceY y of the source handle
 * @param {number} props.targetX x of the target handle
 * @param {number} props.targetY y of the target handle
 * @param {string} props.sourcePosition side of the source handle
 * @param {string} props.targetPosition side of the target handle
 * @param {string} props.markerEnd arrow marker of the target end
 * @param {object} props.style line style set in relationships-to-edges.js
 * @param {{ color: string, sourceBadge: string, targetBadge: string }} props.data marks and color
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
    markerEnd,
    style,
    data
}) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition
    })
    const sourceBadgePosition = getBadgePosition(sourceX, sourceY, sourcePosition)
    const targetBadgePosition = getBadgePosition(targetX, targetY, targetPosition)

    return (
        <>
            {/* the curve with the arrow head */}
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={style}
            />

            {/* 1 and N marks at the two ends */}
            <EdgeLabelRenderer>
                <div
                    className="edge-badge nodrag nopan"
                    style={{
                        color: data.color,
                        transform: `translate(-50%, -50%) translate(${sourceBadgePosition.x}px, ${sourceBadgePosition.y}px)`
                    }}
                >
                    {data.sourceBadge}
                </div>
                <div
                    className="edge-badge nodrag nopan"
                    style={{
                        color: data.color,
                        transform: `translate(-50%, -50%) translate(${targetBadgePosition.x}px, ${targetBadgePosition.y}px)`
                    }}
                >
                    {data.targetBadge}
                </div>
            </EdgeLabelRenderer>
        </>
    )
}

export default RelationshipEdge
