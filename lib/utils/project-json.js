/**
 * project json: the file format used to back up a project and to import it again.
 * the file is the project wrapped with the app name and a version, so an import can
 * tell what it is reading.
 */
import {
    PROJECT_FILE_APP_NAME,
    PROJECT_FILE_VERSION
} from "../constants/export-formats.js"
import { normalizeProject } from "../models/normalize-project.js"
import { SCHEMA_VERSION } from "../constants/storage-keys.js"
import { validateImportedProject } from "../validators/project-import-validator.js"

// distance between collections that come without a position, in pixels
const IMPORT_PLACE_OFFSET = 40

/**
 * builds the text of a project json file.
 * @param {import("../models/factories.js").Project} project project to export
 * @returns {string} json text with 4 space indentation
 */
export function buildProjectJsonText(project) {
    return `${JSON.stringify(
        {
            app: PROJECT_FILE_APP_NAME,
            fileVersion: PROJECT_FILE_VERSION,
            project
        },
        null,
        4
    )}\n`
}

/**
 * gives collections without a usable position a place, so they do not all pile up at the origin.
 * @param {object} collection collection read from the file
 * @param {number} collectionPosition position of the collection in the list
 * @returns {object}
 */
function ensurePosition(collection, collectionPosition) {
    const hasPosition =
        Number.isFinite(collection.position?.x) && Number.isFinite(collection.position?.y)

    if (hasPosition) {
        return collection
    }

    return {
        ...collection,
        position: {
            x: 80 + collectionPosition * IMPORT_PLACE_OFFSET,
            y: 80 + collectionPosition * IMPORT_PLACE_OFFSET
        }
    }
}

/**
 * reads the text of a project json file.
 * accepts the wrapped format written by buildProjectJsonText and a bare project object.
 * the project is validated, filled in and cleaned the same way a saved project is.
 * @param {string} text file content
 * @returns {{ project: import("../models/factories.js").Project | null, error: string | null }}
 */
export function parseProjectJson(text) {
    let parsedValue

    try {
        parsedValue = JSON.parse(text)
    } catch {
        return {
            project: null,
            error: "this file is not valid json"
        }
    }

    const rawProject = parsedValue?.project ?? parsedValue
    const validationError = validateImportedProject(rawProject)

    if (validationError) {
        return {
            project: null,
            error: validationError
        }
    }

    const project = normalizeProject({
        ...rawProject,
        schemaVersion: SCHEMA_VERSION,
        collections: rawProject.collections.map(ensurePosition),
        relationships: Array.isArray(rawProject.relationships) ? rawProject.relationships : []
    })

    return {
        project,
        error: null
    }
}
