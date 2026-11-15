/**
 * custom react flow node that draws one collection card on the canvas.
 * it lists every field including nested ones, nested fields are indented under their parent.
 * every field row has a connection handle on its left and right edge: relationship edges
 * attach to the rows, and dragging from one row's handle to another row's handle connects
 * the two fields. the header has two hidden handles that embed edges end at.
 * rows that take part in a relationship are always listed and always show their handle.
 */
import {
    Handle,
    Position,
    useConnection,
    useUpdateNodeInternals
} from "@xyflow/react"
import { memo, useEffect } from "react"
import {
    LEFT_SIDE,
    RIGHT_SIDE,
    buildCardHandleId,
    buildFieldHandleId
} from "../../lib/utils/handle-ids.js"

// how many ordinary field rows a card lists before it shows "+N more"
const MAX_VISIBLE_ROWS = 14

// indentation of each nesting level, in pixels
const NESTED_INDENT_PX = 14

// the two sides a row can connect on
const HANDLE_SIDES = [
    {
        side: LEFT_SIDE,
        position: Position.Left
    },
    {
        side: RIGHT_SIDE,
        position: Position.Right
    }
]

/**
 * picks the rows a card lists: the first MAX_VISIBLE_ROWS ordinary rows and every row
 * that takes part in a relationship (its edge needs the row's handle).
 * @param {Array<{ linkType: string }>} rows all field rows of the collection
 * @returns {Array} the rows to draw, in their original order
 */
function pickVisibleRows(rows) {
    let ordinaryRowCount = 0

    return rows.filter((row) => {
        if (row.linkType) {
            return true
        }

        ordinaryRowCount += 1

        return ordinaryRowCount <= MAX_VISIBLE_ROWS
    })
}

/**
 * collection card.
 * @param {{ id: string, data: { name: string, fieldRows: Array }, selected: boolean }} props
 * @returns {JSX.Element}
 */
function CollectionNode({ id, data, selected }) {
    const updateNodeInternals = useUpdateNodeInternals()

    // true while the user drags a connection line, all row handles show so targets are easy to find
    const isConnecting = useConnection((connection) => connection.inProgress)

    const visibleRows = pickVisibleRows(data.fieldRows)
    const hiddenRowCount = data.fieldRows.length - visibleRows.length
    const rowSignature = visibleRows.map((row) => row.id).join(",")

    // handles move when rows are added, removed or reordered, react flow must measure them again
    useEffect(() => {
        updateNodeInternals(id)
    }, [id, rowSignature, updateNodeInternals])

    const cardClassNames = ["collection-node"]

    if (selected) {
        cardClassNames.push("collection-node-selected")
    }

    if (isConnecting) {
        cardClassNames.push("collection-node-connecting")
    }

    return (
        <div className={cardClassNames.join(" ")}>
            {/* collection name header, with the hidden handles embed edges end at */}
            <div className="collection-node-header">
                {data.name}
                {HANDLE_SIDES.map(({ side, position }) => (
                    <Handle
                        key={side}
                        type="source"
                        position={position}
                        id={buildCardHandleId(side)}
                        isConnectable={false}
                        className="collection-handle collection-handle-card"
                    />
                ))}
            </div>

            {/* field list, nested fields are indented */}
            <div className="collection-node-body">
                {visibleRows.map((row) => (
                    <div
                        key={row.id}
                        className={
                            row.linkType
                                ? `collection-node-field collection-node-field-${row.linkType}`
                                : "collection-node-field"
                        }
                        title={row.description || undefined}
                    >
                        <span
                            className="collection-node-field-name"
                            style={{ paddingLeft: `${row.depth * NESTED_INDENT_PX}px` }}
                        >
                            {row.name}
                            {row.required ? " *" : ""}
                        </span>
                        <span className="collection-node-field-type">{row.typeLabel}</span>

                        {/* connection handles of this field, one on each side */}
                        {HANDLE_SIDES.map(({ side, position }) => (
                            <Handle
                                key={side}
                                type="source"
                                position={position}
                                id={buildFieldHandleId(row.id, side)}
                                className={
                                    row.linkType
                                        ? `collection-handle collection-handle-${row.linkType}`
                                        : "collection-handle"
                                }
                            />
                        ))}
                    </div>
                ))}

                {/* hidden rows note */}
                {hiddenRowCount > 0 && (
                    <div className="collection-node-note">+{hiddenRowCount} more</div>
                )}
            </div>
        </div>
    )
}

export default memo(CollectionNode)
