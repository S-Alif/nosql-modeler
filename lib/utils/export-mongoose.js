/**
 * turns the project into mongoose model files (plain javascript, es modules).
 * one file per collection exports its schema and its model, models/index.js exports all models.
 * the files import what they use by name: import { Schema, model, models } from "mongoose".
 *
 * how the project maps to mongoose:
 *  - field types: string String, int and long Number (with an integer check), double Number,
 *    decimal Decimal128, boolean Boolean, date Date, objectId ObjectId, binData Buffer, mixed Mixed
 *  - required, default, enum, minLength, maxLength, match, trim, lowercase, uppercase, min and max
 *    are written when they are set and fit the field, a ttl becomes `expires`
 *  - an object field is a nested object, a required one is a sub schema (mongoose cannot require
 *    a plain nested object), an array of objects is an array of sub documents without their own _id
 *  - a reference to the _id of another collection becomes `ref`
 *  - an embed becomes the schema of the embedded collection, imported from its file
 *  - indexes become schema.index(...) calls, one place for all of them (single field, compound,
 *    unique), never the field level `index: true` or `unique: true`, which mean the same thing
 *    and would create the index twice
 *  - the automatic _id (objectId) is left out, mongoose adds it
 * things mongoose cannot express are kept as comments above the field.
 */
import { DEFAULT_MONGOOSE_OPTIONS } from "../constants/export-formats.js"
import {
    ARRAY_FIELD_TYPE,
    OBJECT_FIELD_TYPE
} from "../constants/field-types.js"
import {
    DATE_OPTION_CATEGORY,
    FLOAT_OPTION_CATEGORY,
    INTEGER_OPTION_CATEGORY
} from "../constants/field-options.js"
import {
    EMBED_RELATIONSHIP,
    REFERENCE_RELATIONSHIP
} from "../constants/relationship-types.js"
import {
    call,
    codeObject,
    printValue,
    raw
} from "./code-writer.js"
import {
    getDefaultValueForCode,
    getEnumValuesForCode
} from "./field-values.js"
import {
    getApplicableOptionKeys,
    getFieldOptionCategory,
    getFieldValueType,
    getTtlSeconds,
    isOptionActive
} from "./field-options.js"
import { findFieldById } from "./field-tree.js"
import { flattenFieldPaths } from "./field-paths.js"
import {
    toKebabCase,
    toPascalCase,
    toSchemaVariableName
} from "./name-formats.js"

// mongoose class used for every field type
const MONGOOSE_TYPE_CODE = {
    string: "String",
    int: "Number",
    long: "Number",
    double: "Number",
    decimal: "Schema.Types.Decimal128",
    boolean: "Boolean",
    date: "Date",
    objectId: "Schema.Types.ObjectId",
    binData: "Buffer",
    mixed: "Schema.Types.Mixed"
}

// types a mongoose ref can be set on
const REF_VALUE_TYPES = ["objectId", "string", "int", "long", "double", "binData"]

/**
 * tells whether the collection `fromCollectionId` embeds, directly or through other embeds,
 * the collection `toCollectionId`. used to stop two collections from importing each other.
 * @param {import("../models/factories.js").Project} project project to read
 * @param {string} fromCollectionId collection to start from
 * @param {string} toCollectionId collection to look for
 * @param {Set<string>} [visitedIds] collections already visited
 * @returns {boolean}
 */
export function doesEmbedReach(project, fromCollectionId, toCollectionId, visitedIds = new Set()) {
    if (visitedIds.has(fromCollectionId)) {
        return false
    }

    visitedIds.add(fromCollectionId)

    return project.relationships
        .filter(
            (relationship) =>
                relationship.type === EMBED_RELATIONSHIP &&
                relationship.sourceCollectionId === fromCollectionId
        )
        .some(
            (relationship) =>
                relationship.targetCollectionId === toCollectionId ||
                doesEmbedReach(project, relationship.targetCollectionId, toCollectionId, visitedIds)
        )
}

/**
 * builds the options of one field value (a scalar field, or the items of an array).
 * @param {import("../models/factories.js").Field} field field to read
 * @param {Array<{ key: string, value: any }>} entries list the options are added to
 * @param {string[]} notes list that collects remarks about things mongoose cannot express
 */
function addValueOptions(field, entries, notes) {
    const category = getFieldOptionCategory(field)
    const applicableKeys = getApplicableOptionKeys(field)
    const valueType = getFieldValueType(field)
    const isDecimal = valueType === "decimal"
    const isNumeric = category === INTEGER_OPTION_CATEGORY || category === FLOAT_OPTION_CATEGORY
    const activeKeys = applicableKeys.filter((optionKey) => isOptionActive(field.options, optionKey))
    const skippedKeys = []

    activeKeys.forEach((optionKey) => {
        const optionValue = field.options[optionKey]

        switch (optionKey) {
            case "enumValues": {
                if (isDecimal) {
                    skippedKeys.push("enum")
                    return
                }

                entries.push({
                    key: "enum",
                    value: getEnumValuesForCode(optionValue, isNumeric)
                })
                return
            }

            case "minLength":
            case "maxLength": {
                entries.push({
                    key: optionKey,
                    value: Number(optionValue)
                })
                return
            }

            case "match": {
                entries.push({
                    key: "match",
                    value: raw(`new RegExp(${JSON.stringify(optionValue)})`)
                })
                return
            }

            case "trim":
            case "lowercase":
            case "uppercase": {
                entries.push({
                    key: optionKey,
                    value: true
                })
                return
            }

            case "min":
            case "max": {
                if (isDecimal) {
                    skippedKeys.push(optionKey)
                    return
                }

                entries.push({
                    key: optionKey,
                    value:
                        category === DATE_OPTION_CATEGORY
                            ? raw(`new Date(${JSON.stringify(optionValue.trim())})`)
                            : Number(optionValue)
                })
                return
            }

            default: {
                // ttlValue stands for the whole ttl setting
                const ttlSeconds = getTtlSeconds(field)

                if (ttlSeconds !== null) {
                    entries.push({
                        key: "expires",
                        value: ttlSeconds
                    })
                }
            }
        }
    })

    // whole numbers are checked with a validator, mongoose has no integer type
    if (valueType === "int" || valueType === "long") {
        entries.push({
            key: "validate",
            value: {
                validator: raw("Number.isInteger"),
                message: "{PATH} must be a whole number"
            }
        })
    }

    if (skippedKeys.length > 0) {
        notes.push(
            `${skippedKeys.join(", ")} not supported by Decimal128 in mongoose, only the mongodb validator checks it`
        )
    }
}

/**
 * wraps a type and its options into a field definition, the bare type when there are no options.
 * @param {any} typeCode the type, raw code or an array holding it
 * @param {Array<{ key: string, value: any }>} optionEntries options in print order
 * @returns {any}
 */
function makeDefinition(typeCode, optionEntries) {
    if (optionEntries.length === 0) {
        return typeCode
    }

    return codeObject([
        {
            key: "type",
            value: typeCode
        },
        ...optionEntries
    ])
}

/**
 * builds the nested fields of an object field, or of the items of an array of objects.
 * @param {import("../models/factories.js").Field[]} fields child fields
 * @param {object} context export context, see buildSchemaFile
 * @param {import("../models/factories.js").Collection} collection collection that owns the fields
 * @param {boolean} isSubDocument true for the items of an array, which get no _id of their own
 * @returns {object} code object with one key per field
 */
function buildChildEntries(fields, context, collection, isSubDocument) {
    const entries = buildFieldEntries(fields, context, collection, false)
    const hasOwnIdField = fields.some((field) => field.name === "_id")

    if (isSubDocument && !hasOwnIdField) {
        entries.unshift({
            key: "_id",
            value: false
        })
    }

    return codeObject(entries)
}

/**
 * builds the mongoose definition of one field.
 * @param {import("../models/factories.js").Field} field field to build
 * @param {object} context export context, see buildSchemaFile
 * @param {import("../models/factories.js").Collection} collection collection that owns the field
 * @param {string[]} notes list that collects remarks to write above the field
 * @returns {any} code value of the field
 */
function buildFieldDefinition(field, context, collection, notes) {
    const isArray = field.type === ARRAY_FIELD_TYPE
    const embedRelationship = context.project.relationships.find(
        (relationship) =>
            relationship.type === EMBED_RELATIONSHIP &&
            relationship.sourceFieldId === field.id &&
            relationship.sourceCollectionId === collection.id
    )
    const referenceRelationship = context.project.relationships.find(
        (relationship) =>
            relationship.type === REFERENCE_RELATIONSHIP &&
            relationship.sourceFieldId === field.id &&
            relationship.sourceCollectionId === collection.id
    )

    // field level options: required and the default value of a single value
    const fieldOptions = []

    if (field.required && !field.isSystem) {
        fieldOptions.push({
            key: "required",
            value: true
        })
    }

    if (!isArray && field.type !== OBJECT_FIELD_TYPE) {
        const defaultValue = getDefaultValueForCode(field)

        if (defaultValue !== undefined) {
            fieldOptions.push({
                key: "default",
                value: defaultValue
            })
        }
    }

    // an embed uses the schema of the embedded collection
    if (embedRelationship) {
        const targetCollection = context.project.collections.find(
            (candidate) => candidate.id === embedRelationship.targetCollectionId
        )
        const wouldImportEachOther = doesEmbedReach(
            context.project,
            targetCollection.id,
            collection.id
        )

        if (!wouldImportEachOther) {
            context.embeddedCollections.set(targetCollection.id, targetCollection)

            const schemaCode = raw(toSchemaVariableName(targetCollection.name))

            return makeDefinition(isArray ? [schemaCode] : schemaCode, fieldOptions)
        }

        notes.push(
            `embeds ${targetCollection.name}, which embeds this collection too, so it is a mixed value here`
        )

        return makeDefinition(raw("Schema.Types.Mixed"), fieldOptions)
    }

    // objects and arrays of objects hold their own fields
    if (field.type === OBJECT_FIELD_TYPE || (isArray && field.itemType === OBJECT_FIELD_TYPE)) {
        const childCode = buildChildEntries(field.children, context, collection, isArray)

        if (field.children.length === 0) {
            return makeDefinition(raw("Schema.Types.Mixed"), fieldOptions)
        }

        if (isArray) {
            return fieldOptions.length === 0 ? [childCode] : makeDefinition([childCode], fieldOptions)
        }

        // mongoose cannot require a plain nested object, a sub schema can be required
        return fieldOptions.length === 0
            ? childCode
            : makeDefinition(call("new Schema", [childCode, { _id: false }]), fieldOptions)
    }

    // scalar values and arrays of scalars: the options belong to the value (the items of an array)
    const valueType = getFieldValueType(field)
    const valueOptions = []

    if (referenceRelationship) {
        const targetCollection = context.project.collections.find(
            (candidate) => candidate.id === referenceRelationship.targetCollectionId
        )
        const targetField = targetCollection
            ? findFieldById(targetCollection.fields, referenceRelationship.targetFieldId)
            : null

        if (targetCollection && targetField?.isSystem && REF_VALUE_TYPES.includes(valueType)) {
            valueOptions.push({
                key: "ref",
                value: toPascalCase(targetCollection.name)
            })
        } else if (targetCollection && targetField) {
            notes.push(`references ${targetCollection.name}.${targetField.name}`)
        }
    }

    addValueOptions(field, valueOptions, notes)

    const typeCode = raw(MONGOOSE_TYPE_CODE[valueType] ?? "Schema.Types.Mixed")

    if (!isArray) {
        return makeDefinition(typeCode, [...fieldOptions, ...valueOptions])
    }

    const valueDefinition = makeDefinition(typeCode, valueOptions)

    return fieldOptions.length === 0
        ? [valueDefinition]
        : makeDefinition([valueDefinition], fieldOptions)
}

/**
 * builds the entries of a list of fields, one per field.
 * @param {import("../models/factories.js").Field[]} fields fields to build
 * @param {object} context export context, see buildSchemaFile
 * @param {import("../models/factories.js").Collection} collection collection that owns the fields
 * @param {boolean} isTopLevel true for the fields of the collection itself
 * @returns {Array<{ key: string, value: any, comment?: string }>}
 */
function buildFieldEntries(fields, context, collection, isTopLevel) {
    return fields.flatMap((field) => {
        // mongoose adds the objectId _id by itself
        if (isTopLevel && field.isSystem && field.type === "objectId") {
            return []
        }

        const notes = field.description ? [field.description] : []
        const value = buildFieldDefinition(field, context, collection, notes)

        return [
            {
                key: field.name,
                value,
                comment: notes.length > 0 ? notes.join(", ") : undefined
            }
        ]
    })
}

/**
 * builds the file of one collection.
 * @param {import("../models/factories.js").Project} project project that holds the collection
 * @param {import("../models/factories.js").Collection} collection collection to export
 * @param {{ timestamps: boolean, versionKey: boolean }} options mongoose export options
 * @returns {string} file content
 */
function buildSchemaFile(project, collection, options) {
    const context = {
        project,
        embeddedCollections: new Map()
    }
    const schemaVariable = toSchemaVariableName(collection.name)
    const modelName = toPascalCase(collection.name)
    const fieldEntries = buildFieldEntries(collection.fields, context, collection, true)

    // schema options: only what differs from the mongoose defaults
    const schemaOptions = []

    if (!options.versionKey) {
        schemaOptions.push({
            key: "versionKey",
            value: false
        })
    }

    if (options.timestamps) {
        schemaOptions.push({
            key: "timestamps",
            value: true
        })
    }

    const schemaArguments = [codeObject(fieldEntries)]

    if (schemaOptions.length > 0) {
        schemaArguments.push(codeObject(schemaOptions))
    }

    // indexes
    const indexLines = collection.indexes.map((index) => {
        const keysCode = codeObject(
            index.keys.map((key) => ({
                key: flattenFieldPaths(collection.fields).find((entry) => entry.id === key.fieldId)?.path ?? "?",
                value: key.direction
            }))
        )

        return index.unique
            ? `${schemaVariable}.index(${printValue(keysCode)}, { unique: true })`
            : `${schemaVariable}.index(${printValue(keysCode)})`
    })

    const importLines = [
        "import { Schema, model, models } from \"mongoose\"",
        ...[...context.embeddedCollections.values()].map(
            (embeddedCollection) =>
                `import { ${toSchemaVariableName(embeddedCollection.name)} } from "./${toKebabCase(embeddedCollection.name)}.js"`
        )
    ]

    return [
        importLines.join("\n"),
        `/**\n * schema and model of the ${collection.name} collection, generated by NoSQL Modeler\n */\nconst ${schemaVariable} = ${printValue(call("new Schema", schemaArguments))}`,
        ...(indexLines.length > 0 ? [indexLines.join("\n")] : []),
        `const ${modelName} = models.${modelName} || model(${JSON.stringify(modelName)}, ${schemaVariable}, ${JSON.stringify(collection.name)})`,
        `export { ${modelName}, ${schemaVariable} }\nexport default ${modelName}`
    ].join("\n\n") + "\n"
}

/**
 * builds models/index.js, which exports every model.
 * @param {import("../models/factories.js").Collection[]} collections collections of the project
 * @returns {string} file content
 */
function buildIndexFile(collections) {
    const importLines = collections.map(
        (collection) =>
            `import { ${toPascalCase(collection.name)} } from "./${toKebabCase(collection.name)}.js"`
    )
    const modelNames = collections.map((collection) => toPascalCase(collection.name))
    const exportCode =
        modelNames.length === 1
            ? `export { ${modelNames[0]} }`
            : `export {\n${modelNames.map((modelName) => `    ${modelName}`).join(",\n")}\n}`

    return `${importLines.join("\n")}\n\n${exportCode}\n`
}

/**
 * builds the mongoose files of the whole project.
 * @param {import("../models/factories.js").Project} project project to export
 * @param {{ timestamps?: boolean, versionKey?: boolean }} [options] mongoose export options
 * @returns {Array<{ name: string, content: string }>} one file per collection plus models/index.js
 */
export function buildMongooseFiles(project, options = {}) {
    const mergedOptions = {
        ...DEFAULT_MONGOOSE_OPTIONS,
        ...options
    }

    if (project.collections.length === 0) {
        return []
    }

    return [
        ...project.collections.map((collection) => ({
            name: `models/${toKebabCase(collection.name)}.js`,
            content: buildSchemaFile(project, collection, mergedOptions)
        })),
        {
            name: "models/index.js",
            content: buildIndexFile(project.collections)
        }
    ]
}
