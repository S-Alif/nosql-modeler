/**
 * keeps indexes consistent with the fields they index.
 */
import { findFieldById } from "./field-tree.js"
import { haveSameKeys } from "./index-operations.js"

/**
 * removes index keys whose field no longer exists, and indexes that have no key left.
 * an index that was shortened and now has the same keys as another index is removed too.
 * returns the same project object when nothing had to be removed.
 * @param {import("../models/factories.js").Project} project project to check
 * @returns {import("../models/factories.js").Project}
 */
export function pruneOrphanIndexes(project) {
    let hasChanged = false

    const collections = project.collections.map((collection) => {
        const keptIndexes = []
        const shortenedIndexes = []
        let isCollectionChanged = false

        collection.indexes.forEach((index) => {
            const keptKeys = index.keys.filter((key) => findFieldById(collection.fields, key.fieldId))

            // an index that lost every key is dropped, one that lost some keys is shortened
            if (keptKeys.length === index.keys.length) {
                keptIndexes.push(index)
                return
            }

            isCollectionChanged = true

            if (keptKeys.length > 0) {
                shortenedIndexes.push({
                    ...index,
                    keys: keptKeys
                })
            }
        })

        // a shortened index is only kept when no other index has the same keys
        shortenedIndexes.forEach((shortenedIndex) => {
            const isDuplicate = keptIndexes.some((keptIndex) =>
                haveSameKeys(keptIndex.keys, shortenedIndex.keys)
            )

            if (!isDuplicate) {
                keptIndexes.push(shortenedIndex)
            }
        })

        hasChanged = hasChanged || isCollectionChanged

        return isCollectionChanged
            ? {
                ...collection,
                indexes: keptIndexes
            }
            : collection
    })

    return hasChanged
        ? {
            ...project,
            collections
        }
        : project
}
