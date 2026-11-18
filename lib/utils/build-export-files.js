/**
 * builds the files of an export format.
 * this is the one function the export dialog calls, the format decides which exporter runs.
 */
import {
    MONGOOSE_FORMAT,
    MONGOSH_FORMAT,
    PROJECT_JSON_FORMAT,
    VALIDATOR_FORMAT
} from "../constants/export-formats.js"
import { buildMongooseFiles } from "./export-mongoose.js"
import {
    buildMongoshFiles,
    buildValidatorFiles
} from "./export-validators.js"
import { buildProjectJsonText } from "./project-json.js"

// file name of the project json export
const PROJECT_JSON_FILE_NAME = "nosql-modeler-project.json"

/**
 * builds the files of one export format.
 * @param {string} formatId one of the format ids in lib/constants/export-formats.js
 * @param {import("../models/factories.js").Project} project project to export
 * @param {{ timestamps?: boolean, versionKey?: boolean }} [mongooseOptions] options of the mongoose format
 * @returns {Array<{ name: string, content: string }>} the files, empty when there is nothing to export
 */
export function buildExportFiles(formatId, project, mongooseOptions = {}) {
    switch (formatId) {
        case MONGOOSE_FORMAT: {
            return buildMongooseFiles(project, mongooseOptions)
        }

        case MONGOSH_FORMAT: {
            return buildMongoshFiles(project)
        }

        case VALIDATOR_FORMAT: {
            return buildValidatorFiles(project)
        }

        case PROJECT_JSON_FORMAT: {
            return [
                {
                    name: PROJECT_JSON_FILE_NAME,
                    content: buildProjectJsonText(project)
                }
            ]
        }

        default: {
            return []
        }
    }
}
