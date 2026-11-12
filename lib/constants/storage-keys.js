/**
 * constants used by the local storage layer.
 */

// local storage key that holds the saved project json
const STORAGE_KEY = "mongo-modeler:project"

// local storage key where an unreadable or newer project is copied before it is replaced
const STORAGE_BACKUP_KEY = "mongo-modeler:project-backup"

// version of the saved project shape, bump it when the shape changes
const SCHEMA_VERSION = 1

// how long to wait after the last change before saving, in milliseconds
const SAVE_DEBOUNCE_MS = 400

export {
    STORAGE_KEY,
    STORAGE_BACKUP_KEY,
    SCHEMA_VERSION,
    SAVE_DEBOUNCE_MS
}
