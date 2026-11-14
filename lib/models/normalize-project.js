/**
 * brings a loaded project up to the current shape.
 * projects saved by older batches have no _id field, no field descriptions
 * and may hold relationships that no longer match their fields, so this fills
 * and cleans them. it is safe to run on a project more than once.
 */
import {
    ARRAY_FIELD_TYPE,
    ID_FIELD_NAME,
    ID_FIELD_TYPE
} from "../constants/field-types.js"
import {
    REFERENCE_RELATIONSHIP,
    RELATIONSHIP_TYPES
} from "../constants/relationship-types.js"
import { pruneOrphanRelationships } from "../utils/prune-relationships.js"
import { createIdField } from "./factories.js"

/**
 * fills in missing field properties, nested fields included.
 * @param {object} field field loaded from storage
 * @returns {import("./factories.js").Field}
 */
function normalizeField(field) {
    return {
        ...field,
        description: field.description ?? "",
        isSystem: field.isSystem ?? false,
        children: (field.children ?? []).map(normalizeField)
    }
}

/**
 * makes sure the collection has its _id field as the first, locked field.
 * a top level field already named _id is kept and locked, a missing one is created.
 * @param {object} collection collection loaded from storage
 * @returns {import("./factories.js").Collection}
 */
function normalizeCollection(collection) {
    const normalizedFields = (collection.fields ?? []).map(normalizeField)
    const idFieldIndex = normalizedFields.findIndex((field) => field.name === ID_FIELD_NAME)

    if (idFieldIndex === -1) {
        return {
            ...collection,
            fields: [createIdField(), ...normalizedFields]
        }
    }

    const existingIdField = normalizedFields[idFieldIndex]
    const lockedIdField = {
        ...existingIdField,
        type: existingIdField.type === ARRAY_FIELD_TYPE ? ID_FIELD_TYPE : existingIdField.type,
        required: true,
        isSystem: true
    }
    const otherFields = normalizedFields.filter((field, fieldIndex) => fieldIndex !== idFieldIndex)

    return {
        ...collection,
        fields: [lockedIdField, ...otherFields]
    }
}

/**
 * gives a relationship a valid type.
 * @param {object} relationship relationship loaded from storage
 * @returns {import("./factories.js").Relationship}
 */
function normalizeRelationship(relationship) {
    return {
        ...relationship,
        type: RELATIONSHIP_TYPES.includes(relationship.type)
            ? relationship.type
            : REFERENCE_RELATIONSHIP
    }
}

/**
 * normalizes every collection and relationship of a project.
 * relationships whose collections or source field are missing are removed.
 * @param {import("./factories.js").Project} project project loaded from storage
 * @returns {import("./factories.js").Project}
 */
export function normalizeProject(project) {
    return pruneOrphanRelationships({
        ...project,
        collections: project.collections.map(normalizeCollection),
        relationships: (project.relationships ?? []).map(normalizeRelationship)
    })
}
