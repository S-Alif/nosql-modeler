/**
 * custom react flow node that draws one collection card on the canvas.
 * batch 4 will list the real fields inside the card body.
 */
import { memo } from "react"

/**
 * collection card.
 * @param {{ data: { name: string, fieldCount: number }, selected: boolean }} props
 * @returns {JSX.Element}
 */
function CollectionNode({ data, selected }) {
    return (
        <div className={selected ? "collection-node collection-node-selected" : "collection-node"}>
            {/* collection name header */}
            <div className="collection-node-header">{data.name}</div>

            {/* field list (batch 4 renders the real fields here) */}
            <div className="collection-node-body">
                {data.fieldCount} {data.fieldCount === 1 ? "field" : "fields"}
            </div>
        </div>
    )
}

export default memo(CollectionNode)
