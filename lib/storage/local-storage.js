/**
 * local storage persistence for the modeler project.
 * every function here is wrapped so a storage failure
 * (private mode, quota exceeded, broken json) never crashes the app.
 */
import {
    SCHEMA_VERSION,
    STORAGE_BACKUP_KEY,
    STORAGE_KEY
} from "../constants/storage-keys.js"
import { createEmptyProject } from "../models/factories.js"

/**
 * higher order function that guards a storage operation.
 * on any error it logs the error and returns the fallback instead of throwing.
 * @param {Function} storageOperation operation that may throw
 * @param {Function} createFallback returns the value to use when the operation fails
 * @returns {Function} guarded version of the operation
 */
function withStorageFallback(storageOperation, createFallback) {
    return function guardedOperation(...operationArguments) {
        try {
            return storageOperation(...operationArguments)
        } catch (error) {
            console.error("local storage error:", error)
            return createFallback()
        }
    }
}

/**
 * checks that a parsed value looks like a project this version can read.
 * @param {unknown} parsedValue value parsed from storage
 * @returns {boolean}
 */
function isReadableProject(parsedValue) {
    return (
        typeof parsedValue === "object" &&
        parsedValue !== null &&
        parsedValue.schemaVersion === SCHEMA_VERSION &&
        Array.isArray(parsedValue.collections) &&
        Array.isArray(parsedValue.relationships)
    )
}

/**
 * loads the saved project, or an empty project when nothing readable is saved.
 * an unreadable saved value is copied to a backup key before it can be overwritten.
 * @returns {import("../models/factories.js").Project}
 */
export const loadProject = withStorageFallback(function readProject() {
    const rawProject = globalThis.localStorage.getItem(STORAGE_KEY)

    if (!rawProject) {
        return createEmptyProject()
    }

    const parsedProject = JSON.parse(rawProject)

    if (!isReadableProject(parsedProject)) {
        globalThis.localStorage.setItem(STORAGE_BACKUP_KEY, rawProject)
        return createEmptyProject()
    }

    return parsedProject
}, createEmptyProject)

/**
 * saves the project to local storage.
 * @param {import("../models/factories.js").Project} project project to save
 * @returns {boolean} true when saved, false when saving failed
 */
export const saveProject = withStorageFallback(function writeProject(project) {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
    return true
}, () => false)
