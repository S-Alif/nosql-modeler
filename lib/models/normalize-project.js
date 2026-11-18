/**
 * brings a loaded project up to the current shape.
 * projects saved by older versions of the app have no _id field, no field descriptions, no field options,
 * and may hold relationships or indexes that no longer match their fields, so this fills
 * and cleans them. it is safe to run on a project more than once.
 */
import {
    ARRAY_FIELD_TYPE,
    DEFAULT_ARRAY_ITEM_TYPE,
    ID_FIELD_NAME,
    ID_FIELD_TYPE
} from "../constants/field-types.js"
import {
    EMBED_RELATIONSHIP,
    REFERENCE_RELATIONSHIP,
    RELATIONSHIP_TYPES
} from "../constants/relationship-types.js"
import { DEFAULT_INDEX_DIRECTION, INDEX_DIRECTIONS } from "../constants/index-options.js"
import { generateId } from "../utils/generate-id.js"
import { pruneOrphanIndexes } from "../utils/prune-indexes.js"
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
 * fills in missing field properties, nested fields included (also for projects read from a file).
 * @param {object} field field loaded from storage
 * @returns {import("./factories.js").Field}
 */
function normalizeField(field) {
    return {
        ...field,
        required: field.required ?? false,
        defaultValue: field.defaultValue ?? "",
        description: field.description ?? "",
        isSystem: field.isSystem ?? false,
        itemType: field.itemType ?? DEFAULT_ARRAY_ITEM_TYPE,
        options: normalizeFieldOptions(field.options),
        children: (field.children ?? []).map(normalizeField)
    }
}

/**
 * cleans the indexes of a collection: every index gets an id, a unique flag and valid keys,
 * keys that are not usable are dropped and an index without keys is removed.
 * keys that point at deleted fields are removed afterwards by pruneOrphanIndexes.
 * @param {object[] | undefined} indexes indexes loaded from storage
 * @returns {import("./factories.js").Index[]}
 */
function normalizeIndexes(indexes) {
    const knownDirections = INDEX_DIRECTIONS.map((direction) => direction.value)

    return (Array.isArray(indexes) ? indexes : [])
        .map((index) => ({
            id: index.id ?? generateId("idx"),
            unique: Boolean(index.unique),
            keys: (Array.isArray(index.keys) ? index.keys : [])
                .filter((key) => typeof key?.fieldId === "string")
                .map((key) => ({
                    fieldId: key.fieldId,
                    direction: knownDirections.includes(key.direction) ? key.direction : DEFAULT_INDEX_DIRECTION
                }))
        }))
        .filter((index) => index.keys.length > 0)
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
            fields: [createIdField(), ...normalizedFields],
            indexes: normalizeIndexes(collection.indexes)
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
        fields: [lockedIdField, ...otherFields],
        indexes: normalizeIndexes(collection.indexes)
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

    return pruneOrphanIndexes(
        pruneOrphanRelationships({
            ...project,
            collections,
            relationships: (project.relationships ?? []).map((relationship) =>
                normalizeRelationship(relationship, collections)
            )
        })
    )
}
