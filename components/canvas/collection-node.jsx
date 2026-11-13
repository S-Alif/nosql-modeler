/**
 * custom react flow node that draws one collection card on the canvas.
 * it lists the top level fields with their types, nested fields are
 * only shown in the inspector.
 */
import { memo } from "react"

// how many fields a card lists before it shows "+N more"
const MAX_VISIBLE_FIELDS = 8

/**
 * collection card.
 * @param {{ data: { name: string, fields: Array }, selected: boolean }} props
 * @returns {JSX.Element}
 */
function CollectionNode({ data, selected }) {
    const visibleFields = data.fields.slice(0, MAX_VISIBLE_FIELDS)
    const hiddenFieldCount = data.fields.length - visibleFields.length

    return (
        <div className={selected ? "collection-node collection-node-selected" : "collection-node"}>
            {/* collection name header */}
            <div className="collection-node-header">{data.name}</div>

            {/* field list */}
            <div className="collection-node-body">
                {data.fields.length === 0 && (
                    <div className="collection-node-note">no fields</div>
                )}

                {visibleFields.map((field) => (
                    <div
                        key={field.id}
                        className="collection-node-field"
                    >
                        <span className="collection-node-field-name">
                            {field.name}
                            {field.required ? " *" : ""}
                        </span>
                        <span className="collection-node-field-type">{field.typeLabel}</span>
                    </div>
                ))}

                {/* hidden fields note */}
                {hiddenFieldCount > 0 && (
                    <div className="collection-node-note">+{hiddenFieldCount} more</div>
                )}
            </div>
        </div>
    )
}

export default memo(CollectionNode)
