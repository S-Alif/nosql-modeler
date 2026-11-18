/**
 * helpers that turn collection names into names for code and files.
 * collection names only hold letters, numbers and underscores (see docs/naming-rules.md).
 */

/**
 * splits a name into lower case words: "userProfiles", "user_profiles" and "UserProfiles"
 * all give ["user", "profiles"].
 * @param {string} name collection name
 * @returns {string[]}
 */
function splitWords(name) {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .split(/[^a-zA-Z0-9]+/)
        .filter((word) => word.length > 0)
        .map((word) => word.toLowerCase())
}

/**
 * turns a name into PascalCase, used for mongoose model names.
 * @param {string} name collection name
 * @returns {string} for example "UserProfiles"
 */
export function toPascalCase(name) {
    const pascalName = splitWords(name)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("")

    return pascalName.length > 0 ? pascalName : "Model"
}

/**
 * turns a name into kebab-case, used for file names.
 * @param {string} name collection name
 * @returns {string} for example "user-profiles"
 */
export function toKebabCase(name) {
    const kebabName = splitWords(name).join("-")

    return kebabName.length > 0 ? kebabName : "collection"
}

/**
 * builds the variable name of the schema of a collection.
 * @param {string} collectionName collection name
 * @returns {string} for example "userProfilesSchema"
 */
export function toSchemaVariableName(collectionName) {
    const pascalName = toPascalCase(collectionName)

    return `${pascalName.charAt(0).toLowerCase()}${pascalName.slice(1)}Schema`
}
