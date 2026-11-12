/**
 * id helper for collections, fields, indexes and relationships.
 */

/**
 * generates a unique id.
 * uses crypto.randomUUID when the browser has it and a random fallback otherwise.
 * @param {string} [prefix] short prefix that tells the entity type, for example "col" or "fld"
 * @returns {string} id like "col_3f2a..."
 */
export function generateId(prefix = "id") {
    const hasRandomUuid = typeof globalThis.crypto?.randomUUID === "function"
    const randomPart = hasRandomUuid
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

    return `${prefix}_${randomPart}`
}
