/**
 * read only helpers that describe indexes: the mongodb style name, warnings, and the
 * ttl fields (a ttl setting on a date field is an index too, see lib/utils/field-options.js).
 */
import { ARRAY_FIELD_TYPE } from "../constants/field-types.js"
import { findFieldById } from "./field-tree.js"
import { flattenFieldPaths, getFieldPath } from "./field-paths.js"
import { getTtlSeconds } from "./field-options.js"

/**
 * builds the name mongodb gives an index: every key as "path_direction", joined with "_".
 * for example "email_1" or "userId_1_createdAt_-1".
 * @param {import("../models/factories.js").Collection} collection collection that owns the index
 * @param {import("../models/factories.js").Index} index index to name
 * @returns {string}
 */
export function getIndexName(collection, index) {
    return index.keys
        .map((key) => `${getFieldPath(collection.fields, key.fieldId) ?? "?"}_${key.direction}`)
        .join("_")
}

/**
 * checks an index for problems mongodb would complain about. shown, never blocked.
 * - more than one array field in one index
 * - a single field index on a field that has a ttl, the ttl already is an index on that field
 * @param {import("../models/factories.js").Collection} collection collection that owns the index
 * @param {import("../models/factories.js").Index} index index to check
 * @returns {string | null} the warning text, or null when the index is fine
 */
export function getIndexWarning(collection, index) {
    const fields = index.keys
        .map((key) => findFieldById(collection.fields, key.fieldId))
        .filter(Boolean)
    const arrayFieldCount = fields.filter((field) => field.type === ARRAY_FIELD_TYPE).length

    if (arrayFieldCount > 1) {
        return "mongodb cannot index more than one array field in the same index"
    }

    if (fields.length === 1 && getTtlSeconds(fields[0]) !== null) {
        return `${fields[0].name} has a ttl, which already is an index on it, a second index on the same field conflicts with it`
    }

    return null
}

/**
 * lists the fields of a collection that have a ttl.
 * @param {import("../models/factories.js").Collection} collection collection to read
 * @returns {Array<{ id: string, path: string, label: string, seconds: number }>} label is like "30 days"
 */
export function listTtlFields(collection) {
    return flattenFieldPaths(collection.fields)
        .filter((entry) => getTtlSeconds(entry.field) !== null)
        .map((entry) => ({
            id: entry.id,
            path: entry.path,
            label: `${entry.field.options.ttlValue} ${entry.field.options.ttlUnit}`,
            seconds: getTtlSeconds(entry.field)
        }))
}
