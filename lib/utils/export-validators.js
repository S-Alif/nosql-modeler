/**
 * turns the project into mongodb $jsonSchema validators and a mongosh setup script.
 *
 * how the project maps to $jsonSchema:
 *  - bsonType follows the field type (boolean is "bool", mixed has no bsonType)
 *  - required fields (never _id) go in the `required` list of their object
 *  - enum, minLength, maxLength, pattern (from match), minimum and maximum are written when they
 *    are set and fit the field. trim, lowercase and uppercase are not validation rules and the
 *    minimum and maximum of dates are not supported by $jsonSchema, so they are left out
 *  - the description of a field becomes `description`
 *  - an embed puts the schema of the embedded collection inside the field
 *  - a ttl and the indexes become createIndex calls in the setup script
 */
import {
    ARRAY_FIELD_TYPE,
    OBJECT_FIELD_TYPE
} from "../constants/field-types.js"
import {
    FLOAT_OPTION_CATEGORY,
    INTEGER_OPTION_CATEGORY
} from "../constants/field-options.js"
import { EMBED_RELATIONSHIP } from "../constants/relationship-types.js"
import { APP_NAME } from "../constants/app-info.js"
import { printValue } from "./code-writer.js"
import { getEnumValuesForCode } from "./field-values.js"
import {
    getFieldOptionCategory,
    getFieldValueType
} from "./field-options.js"
import { flattenFieldPaths } from "./field-paths.js"
import { listTtlFields } from "./index-summary.js"
import { toKebabCase } from "./name-formats.js"

// $jsonSchema bsonType used for every field type, mixed values have no type rule
const BSON_TYPE_BY_FIELD_TYPE = {
    string: "string",
    int: "int",
    long: "long",
    double: "double",
    decimal: "decimal",
    boolean: "bool",
    date: "date",
    objectId: "objectId",
    object: "object",
    binData: "binData"
}

/**
 * builds the rules that come from the options of a field, for one value (or the items of an array).
 * @param {import("../models/factories.js").Field} field field to read
 * @returns {object} rules to merge into the schema of the value
 */
function buildOptionRules(field) {
    const category = getFieldOptionCategory(field)
    const isNumeric = category === INTEGER_OPTION_CATEGORY || category === FLOAT_OPTION_CATEGORY
    const options = field.options
    const rules = {}

    if (options.enumValues.length > 0 && category !== null && category !== "date") {
        rules.enum = getEnumValuesForCode(options.enumValues, isNumeric)
    }

    if (category === "text") {
        if (options.minLength !== "") {
            rules.minLength = Number(options.minLength)
        }

        if (options.maxLength !== "") {
            rules.maxLength = Number(options.maxLength)
        }

        if (options.match !== "") {
            rules.pattern = options.match
        }
    }

    if (isNumeric) {
        if (options.min !== "") {
            rules.minimum = Number(options.min)
        }

        if (options.max !== "") {
            rules.maximum = Number(options.max)
        }
    }

    return rules
}

/**
 * builds the schema of a list of fields: bsonType object with its required list and properties.
 * @param {import("../models/factories.js").Project} project project that holds the fields
 * @param {import("../models/factories.js").Collection} collection collection that owns the fields
 * @param {import("../models/factories.js").Field[]} fields fields to describe
 * @param {Set<string>} visitingIds collections being embedded right now, stops endless embeds
 * @returns {object}
 */
function buildObjectSchema(project, collection, fields, visitingIds) {
    const requiredNames = fields
        .filter((field) => field.required && !field.isSystem)
        .map((field) => field.name)
    const properties = {}

    fields.forEach((field) => {
        properties[field.name] = buildFieldSchema(project, collection, field, visitingIds)
    })

    return {
        bsonType: "object",
        ...(requiredNames.length > 0 ? { required: requiredNames } : {}),
        properties
    }
}

/**
 * builds the schema of one field.
 * @param {import("../models/factories.js").Project} project project that holds the field
 * @param {import("../models/factories.js").Collection} collection collection that owns the field
 * @param {import("../models/factories.js").Field} field field to describe
 * @param {Set<string>} visitingIds collections being embedded right now
 * @returns {object}
 */
function buildFieldSchema(project, collection, field, visitingIds) {
    const isArray = field.type === ARRAY_FIELD_TYPE
    const descriptionRule = field.description ? { description: field.description } : {}
    const embedRelationship = project.relationships.find(
        (relationship) =>
            relationship.type === EMBED_RELATIONSHIP &&
            relationship.sourceFieldId === field.id &&
            relationship.sourceCollectionId === collection.id
    )

    // value schema: the field itself, or the items of an array
    let valueSchema

    if (embedRelationship) {
        const targetCollection = project.collections.find(
            (candidate) => candidate.id === embedRelationship.targetCollectionId
        )

        valueSchema =
            targetCollection && !visitingIds.has(targetCollection.id)
                ? buildObjectSchema(
                    project,
                    targetCollection,
                    targetCollection.fields,
                    new Set([...visitingIds, targetCollection.id])
                )
                : { bsonType: "object" }
    } else if (getFieldValueType(field) === OBJECT_FIELD_TYPE) {
        valueSchema = buildObjectSchema(project, collection, field.children, visitingIds)
    } else {
        const bsonType = BSON_TYPE_BY_FIELD_TYPE[getFieldValueType(field)]

        valueSchema = {
            ...(bsonType ? { bsonType } : {}),
            ...buildOptionRules(field)
        }
    }

    if (isArray) {
        return {
            bsonType: "array",
            ...descriptionRule,
            items: valueSchema
        }
    }

    return embedRelationship || field.type === OBJECT_FIELD_TYPE
        ? {
            ...descriptionRule,
            ...valueSchema
        }
        : {
            ...valueSchema,
            ...descriptionRule
        }
}

/**
 * builds the $jsonSchema validator of one collection.
 * @param {import("../models/factories.js").Project} project project that holds the collection
 * @param {import("../models/factories.js").Collection} collection collection to describe
 * @returns {{ $jsonSchema: object }} the validator document
 */
export function buildCollectionValidator(project, collection) {
    return {
        $jsonSchema: buildObjectSchema(project, collection, collection.fields, new Set([collection.id]))
    }
}

/**
 * builds one validator file per collection, as json.
 * @param {import("../models/factories.js").Project} project project to export
 * @returns {Array<{ name: string, content: string }>}
 */
export function buildValidatorFiles(project) {
    return project.collections.map((collection) => ({
        name: `validators/${toKebabCase(collection.name)}.json`,
        content: `${JSON.stringify(buildCollectionValidator(project, collection), null, 4)}\n`
    }))
}

/**
 * builds the createIndex calls of a collection: its indexes and its ttl fields.
 * @param {import("../models/factories.js").Collection} collection collection to read
 * @returns {string[]} one line of code per index
 */
function buildIndexStatements(collection) {
    const collectionCode = `db.getCollection(${JSON.stringify(collection.name)})`
    const fieldPaths = flattenFieldPaths(collection.fields)
    const indexStatements = collection.indexes.map((index) => {
        const keys = {}

        index.keys.forEach((key) => {
            keys[fieldPaths.find((entry) => entry.id === key.fieldId)?.path ?? "?"] = key.direction
        })

        return index.unique
            ? `${collectionCode}.createIndex(${printValue(keys)}, { unique: true })`
            : `${collectionCode}.createIndex(${printValue(keys)})`
    })
    const ttlStatements = listTtlFields(collection).map(
        (ttlField) =>
            `${collectionCode}.createIndex({ ${JSON.stringify(ttlField.path)}: 1 }, { expireAfterSeconds: ${ttlField.seconds} })`
    )

    return [...indexStatements, ...ttlStatements]
}

/**
 * builds the mongosh setup script: every collection with its validator, then its indexes.
 * @param {import("../models/factories.js").Project} project project to export
 * @returns {Array<{ name: string, content: string }>} one file, or none when there are no collections
 */
export function buildMongoshFiles(project) {
    if (project.collections.length === 0) {
        return []
    }

    const header = [
        "/**",
        ` * mongodb setup script, generated by ${APP_NAME}`,
        " * creates every collection with its validator and its indexes.",
        " * run it once on an empty database: mongosh \"<connection string>/<database>\" setup.js",
        " * to change the validator of a collection that exists, use db.runCommand({ collMod: ..., validator: ... })",
        " */"
    ].join("\n")

    const collectionBlocks = project.collections.map((collection) => {
        const createCode = `db.createCollection(${JSON.stringify(collection.name)}, ${printValue({ validator: buildCollectionValidator(project, collection) })})`
        const indexStatements = buildIndexStatements(collection)

        return [`// ${collection.name}`, createCode, ...indexStatements].join("\n")
    })

    return [
        {
            name: "setup.js",
            content: `${header}\n\n${collectionBlocks.join("\n\n")}\n`
        }
    ]
}
