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
 * @param {Map<string, string>} [linkTypes] relationship type of every field that is part of a relationship, by field id
 * @returns {Array<{ id: string, name: string, typeLabel: string, linkType: string, required: boolean, description: string, depth: number }>}
 *   linkType is "reference", "embed" or "" for a field without a relationship
 */
export function flattenFieldRows(fields, depth = 0, linkTypes = new Map()) {
    return fields.flatMap((field) => [
        {
            id: field.id,
            name: field.name,
            typeLabel: formatFieldType(field),
            linkType: linkTypes.get(field.id) ?? "",
            required: field.required && !field.isSystem,
            description: field.description ?? "",
            depth
        },
        ...flattenFieldRows(field.children, depth + 1, linkTypes)
    ])
}

/**
 * builds react flow nodes from project collections.
 * measured sizes of the previous nodes are kept so cards do not flicker
 * while react flow measures them again.
 * @param {import("../models/factories.js").Collection[]} collections project collections
 * @param {string | null} selectedCollectionId id of the selected collection
 * @param {Array} [previousNodes] nodes currently held by react flow
 * @param {import("../models/factories.js").Relationship[]} [relationships] project relationships, used to mark the fields that take part in one
 * @returns {Array} react flow nodes
 */
export function collectionsToNodes(
    collections,
    selectedCollectionId,
    previousNodes = [],
    relationships = []
) {
    const previousNodeById = new Map(previousNodes.map((node) => [node.id, node]))

    // relationship type of every field that takes part in a relationship, the field that
    // holds the link wins when a field is both a target and a source
    const linkTypes = new Map()

    for (const relationship of relationships) {
        if (relationship.targetFieldId) {
            linkTypes.set(relationship.targetFieldId, relationship.type)
        }
    }

    for (const relationship of relationships) {
        linkTypes.set(relationship.sourceFieldId, relationship.type)
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
                fieldRows: flattenFieldRows(collection.fields, 0, linkTypes)
            }
        }
    })
}
