/**
 * names for the fields that are created together with a relationship.
 * the user can rename them, this only picks a good starting name.
 */
import { FIELD_NAME_MAX_LENGTH } from "../constants/naming-rules.js"
import { EMBED_RELATIONSHIP } from "../constants/relationship-types.js"
import { generateUniqueName } from "./generate-unique-name.js"

/**
 * lowercases the first letter of a text.
 * @param {string} text text to change
 * @returns {string}
 */
function lowerFirst(text) {
    return text.charAt(0).toLowerCase() + text.slice(1)
}

/**
 * makes a simple english plural singular: categories to category,
 * addresses to address, users to user. it is a guess, the user can rename the field.
 * @param {string} name plural name
 * @returns {string} singular name
 */
export function singularizeName(name) {
    if (/ies$/i.test(name)) {
        return name.replace(/ies$/i, "y")
    }

    if (/(ss|x|ch|sh)es$/i.test(name)) {
        return name.replace(/es$/i, "")
    }

    if (/[^s]s$/i.test(name)) {
        return name.slice(0, -1)
    }

    return name
}

/**
 * builds the name of the field that backs a relationship.
 * a reference gets "<singular>Id" ("user_id" for snake_case targets),
 * an embed gets the singular name. a number is added when the name is taken.
 * @param {string} relationshipType "reference" or "embed"
 * @param {string} targetName name of the target collection
 * @param {string[]} takenNames names of the other top level fields of the source collection
 * @returns {string} a valid, unused field name
 */
export function buildRelationshipFieldName(relationshipType, targetName, takenNames) {
    // leave room for the "_id" or "_1" suffix inside the field name length limit
    const singularName = lowerFirst(singularizeName(targetName)).slice(0, FIELD_NAME_MAX_LENGTH - 8)
    let baseName = singularName

    if (relationshipType !== EMBED_RELATIONSHIP) {
        baseName = targetName.includes("_") ? `${singularName}_id` : `${singularName}Id`
    }

    return takenNames.includes(baseName) ? generateUniqueName(baseName, takenNames) : baseName
}
