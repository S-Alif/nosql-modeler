/**
 * constants for exporting the project.
 * each format turns the project into one or more files, see lib/utils/build-export-files.js.
 */

// ids of the export formats
const MONGOOSE_FORMAT = "mongoose"
const MONGOSH_FORMAT = "mongosh"
const VALIDATOR_FORMAT = "validator"
const PROJECT_JSON_FORMAT = "project-json"

// the formats the export dialog offers, in this order
const EXPORT_FORMATS = [
    {
        id: MONGOOSE_FORMAT,
        label: "Mongoose models",
        description: "one model file per collection (plain javascript, es modules) plus an index.js"
    },
    {
        id: MONGOSH_FORMAT,
        label: "MongoDB setup script",
        description: "mongosh script that creates every collection with its validator and its indexes"
    },
    {
        id: VALIDATOR_FORMAT,
        label: "JSON Schema validators",
        description: "one $jsonSchema validator file per collection, paste it into Compass or Atlas"
    },
    {
        id: PROJECT_JSON_FORMAT,
        label: "Project JSON",
        description: "the whole diagram, to back it up or to import it again"
    }
]

// options of the mongoose export, both start off
const DEFAULT_MONGOOSE_OPTIONS = {
    timestamps: false,
    versionKey: false
}

// name written into a project json file so an import can recognize it
const PROJECT_FILE_APP_NAME = "nosql-modeler"

// version of the project json wrapper, bump it when the wrapper changes
const PROJECT_FILE_VERSION = 1

export {
    MONGOOSE_FORMAT,
    MONGOSH_FORMAT,
    VALIDATOR_FORMAT,
    PROJECT_JSON_FORMAT,
    EXPORT_FORMATS,
    DEFAULT_MONGOOSE_OPTIONS,
    PROJECT_FILE_APP_NAME,
    PROJECT_FILE_VERSION
}
