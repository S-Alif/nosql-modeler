/**
 * name helpers.
 */

/**
 * builds a name like "collection_1" that is not used yet.
 * @param {string} baseName name without the number, for example "collection"
 * @param {string[]} existingNames names that are already taken
 * @returns {string} first free name of the form baseName_number
 */
export function generateUniqueName(baseName, existingNames) {
    const takenNames = new Set(existingNames)
    let suffixNumber = 1

    while (takenNames.has(`${baseName}_${suffixNumber}`)) {
        suffixNumber += 1
    }

    return `${baseName}_${suffixNumber}`
}
