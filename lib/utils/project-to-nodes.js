/**
 * converts project data into react flow nodes.
 */
import { COLLECTION_NODE_TYPE } from "../constants/canvas-config.js"
import { formatFieldType } from "./format-field-type.js"

/**
 * flattens the field tree into the rows a collection card draws.
 * nested fields come right after their parent with a bigger depth,
 * so the card can indent them.
 * @param {import("../models/factories.js").Field[]} fields field list
 * @param {number} [depth] nesting level of this list, 0 for the top level
 * @param {Map<string, string>} [linkTargetNames] collection name each relationship field points at, by field id
 * @returns {Array<{ id: string, name: string, typeLabel: string, linkLabel: string, required: boolean, description: string, depth: number }>}
 */
export function flattenFieldRows(fields, depth = 0, linkTargetNames = new Map()) {
    return fields.flatMap((field) => [
        {
            id: field.id,
            name: field.name,
            typeLabel: formatFieldType(field),
            linkLabel: linkTargetNames.has(field.id) ? `→ ${linkTargetNames.get(field.id)}` : "",
            required: field.required && !field.isSystem,
            description: field.description ?? "",
            depth
        },
        ...flattenFieldRows(field.children, depth + 1, linkTargetNames)
    ])
}

/**
 * builds react flow nodes from project collections.
 * measured sizes of the previous nodes are kept so cards do not flicker
 * while react flow measures them again.
 * @param {import("../models/factories.js").Collection[]} collections project collections
 * @param {string | null} selectedCollectionId id of the selected collection
 * @param {Array} [previousNodes] nodes currently held by react flow
 * @param {import("../models/factories.js").Relationship[]} [relationships] project relationships, used to mark linked fields on the cards
 * @returns {Array} react flow nodes
 */
export function collectionsToNodes(
    collections,
    selectedCollectionId,
    previousNodes = [],
    relationships = []
) {
    const previousNodeById = new Map(previousNodes.map((node) => [node.id, node]))

    // name of the collection each relationship field points at
    const linkTargetNames = new Map()

    for (const relationship of relationships) {
        const targetCollection = collections.find(
            (collection) => collection.id === relationship.targetCollectionId
        )

        if (targetCollection) {
            linkTargetNames.set(relationship.sourceFieldId, targetCollection.name)
        }
    }

    return collections.map((collection) => {
        const previousNode = previousNodeById.get(collection.id)

        return {
            id: collection.id,
            type: COLLECTION_NODE_TYPE,
            position: collection.position,
            selected: collection.id === selectedCollectionId,
            measured: previousNode?.measured,
            data: {
                name: collection.name,
                fieldRows: flattenFieldRows(collection.fields, 0, linkTargetNames)
            }
        }
    })
}
