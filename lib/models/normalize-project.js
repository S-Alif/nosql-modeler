/**
 * brings a loaded project up to the current shape.
 * projects saved by older batches have no _id field, no field descriptions, no field options
 * and may hold relationships that no longer match their fields, so this fills
 * and cleans them. it is safe to run on a project more than once.
 */
import {
    ARRAY_FIELD_TYPE,
    ID_FIELD_NAME,
    ID_FIELD_TYPE
} from "../constants/field-types.js"
import {
    EMBED_RELATIONSHIP,
    REFERENCE_RELATIONSHIP,
    RELATIONSHIP_TYPES
} from "../constants/relationship-types.js"
import { pruneOrphanRelationships } from "../utils/prune-relationships.js"
import { getDefaultTargetField } from "../utils/relationship-rules.js"
import { createFieldOptions, createIdField } from "./factories.js"

/**
 * fills in missing field options, keeping the ones that are saved.
 * @param {object | undefined} options options loaded from storage
 * @returns {import("./factories.js").FieldOptions}
 */
function normalizeFieldOptions(options) {
    const defaultOptions = createFieldOptions()
    const savedOptions = options ?? {}

    return {
        ...defaultOptions,
        ...savedOptions,
        enumValues: Array.isArray(savedOptions.enumValues) ? savedOptions.enumValues : defaultOptions.enumValues
    }
}

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
        options: normalizeFieldOptions(field.options),
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
 * gives a relationship a valid type and a target field.
 * relationships saved before field level links have no target field, a reference
 * pointed at the _id of the target collection, so that field is filled in.
 * an embed never has a target field.
 * @param {object} relationship relationship loaded from storage
 * @param {import("./factories.js").Collection[]} collections normalized collections of the project
 * @returns {import("./factories.js").Relationship}
 */
function normalizeRelationship(relationship, collections) {
    const type = RELATIONSHIP_TYPES.includes(relationship.type)
        ? relationship.type
        : REFERENCE_RELATIONSHIP

    if (type === EMBED_RELATIONSHIP) {
        return {
            ...relationship,
            type,
            targetFieldId: null
        }
    }

    const targetCollection = collections.find(
        (collection) => collection.id === relationship.targetCollectionId
    )
    const defaultTargetField = targetCollection ? getDefaultTargetField(targetCollection) : null

    return {
        ...relationship,
        type,
        targetFieldId: relationship.targetFieldId ?? defaultTargetField?.id ?? null
    }
}

/**
 * normalizes every collection and relationship of a project.
 * relationships whose collections or fields are missing are removed.
 * @param {import("./factories.js").Project} project project loaded from storage
 * @returns {import("./factories.js").Project}
 */
export function normalizeProject(project) {
    const collections = project.collections.map(normalizeCollection)

    return pruneOrphanRelationships({
        ...project,
        collections,
        relationships: (project.relationships ?? []).map((relationship) =>
            normalizeRelationship(relationship, collections)
        )
    })
}
