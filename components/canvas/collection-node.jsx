/**
 * custom react flow node that draws one collection card on the canvas.
 * it lists every field including nested ones, nested fields are indented
 * under their parent.
 */
import { memo } from "react"

// how many field rows a card lists before it shows "+N more"
const MAX_VISIBLE_ROWS = 14

// indentation of each nesting level, in pixels
const NESTED_INDENT_PX = 14

/**
 * collection card.
 * @param {{ data: { name: string, fieldRows: Array }, selected: boolean }} props
 * @returns {JSX.Element}
 */
function CollectionNode({ data, selected }) {
    const visibleRows = data.fieldRows.slice(0, MAX_VISIBLE_ROWS)
    const hiddenRowCount = data.fieldRows.length - visibleRows.length

    return (
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
                        <span className="collection-node-field-type">{row.typeLabel}</span>
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
