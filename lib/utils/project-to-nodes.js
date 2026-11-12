/**
 * converts project data into react flow nodes.
 */
import { COLLECTION_NODE_TYPE } from "../constants/canvas-config.js"

/**
 * builds react flow nodes from project collections.
 * measured sizes of the previous nodes are kept so cards do not flicker
 * while react flow measures them again.
 * @param {import("../models/factories.js").Collection[]} collections project collections
 * @param {string | null} selectedCollectionId id of the selected collection
 * @param {Array} [previousNodes] nodes currently held by react flow
 * @returns {Array} react flow nodes
 */
export function collectionsToNodes(collections, selectedCollectionId, previousNodes = []) {
    const previousNodeById = new Map(previousNodes.map((node) => [node.id, node]))

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
                fieldCount: collection.fields.length
            }
        }
    })
}
