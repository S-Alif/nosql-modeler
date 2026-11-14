/**
 * custom react flow node that draws one collection card on the canvas.
 * it lists every field including nested ones, nested fields are indented
 * under their parent. fields that back a relationship show an arrow to the
 * collection they point at.
 * the card has a source and a target handle on each of its four sides, relationship
 * edges attach to them, and dragging from a handle to another card creates a relationship.
 */
import { Handle, Position } from "@xyflow/react"
import { Fragment, memo } from "react"

// how many field rows a card lists before it shows "+N more"
const MAX_VISIBLE_ROWS = 14

// indentation of each nesting level, in pixels
const NESTED_INDENT_PX = 14

// the four sides of a card, the edge builder refers to them by name
const HANDLE_POSITIONS = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left
}

/**
 * collection card.
 * @param {{ data: { name: string, fieldRows: Array }, selected: boolean }} props
 * @returns {JSX.Element}
 */
function CollectionNode({ data, selected }) {
    const visibleRows = data.fieldRows.slice(0, MAX_VISIBLE_ROWS)
    const hiddenRowCount = data.fieldRows.length - visibleRows.length

    return (
        <>
            {/* relationship handles, a target and a source on every side (shown on hover) */}
            {Object.entries(HANDLE_POSITIONS).map(([sideName, handlePosition]) => (
                <Fragment key={sideName}>
                    <Handle
                        type="target"
                        position={handlePosition}
                        id={`${sideName}-target`}
                        className="collection-handle"
                    />
                    <Handle
                        type="source"
                        position={handlePosition}
                        id={`${sideName}-source`}
                        className="collection-handle"
                    />
                </Fragment>
            ))}

            <div className={selected ? "collection-node collection-node-selected" : "collection-node"}>
                {/* collection name header */}
                <div className="collection-node-header">{data.name}</div>

                {/* field list, nested fields are indented */}
                <div className="collection-node-body">
                    {visibleRows.map((row) => (
                        <div
                            key={row.id}
                            className="collection-node-field"
                            title={row.description || undefined}
                        >
                            <span
                                className="collection-node-field-name"
                                style={{ paddingLeft: `${row.depth * NESTED_INDENT_PX}px` }}
                            >
                                {row.name}
                                {row.required ? " *" : ""}
                            </span>
                            <span className="collection-node-field-type">
                                {row.typeLabel}
                                {row.linkLabel ? ` ${row.linkLabel}` : ""}
                            </span>
                        </div>
                    ))}

                    {/* hidden rows note */}
                    {hiddenRowCount > 0 && (
                        <div className="collection-node-note">+{hiddenRowCount} more</div>
                    )}
                </div>
            </div>
        </>
    )
}

export default memo(CollectionNode)
