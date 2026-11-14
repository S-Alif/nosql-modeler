/**
 * action type names for the modeler reducer.
 * every dispatch call uses one of these so a typo fails loudly
 * instead of silently doing nothing.
 */

// collection actions
const ADD_COLLECTION = "ADD_COLLECTION"
const RENAME_COLLECTION = "RENAME_COLLECTION"
const DELETE_COLLECTION = "DELETE_COLLECTION"
const MOVE_COLLECTION = "MOVE_COLLECTION"

// field actions
const ADD_FIELD = "ADD_FIELD"
const UPDATE_FIELD = "UPDATE_FIELD"
const DELETE_FIELD = "DELETE_FIELD"
const MOVE_FIELD = "MOVE_FIELD"

// relationship actions
const ADD_RELATIONSHIP = "ADD_RELATIONSHIP"
const UPDATE_RELATIONSHIP = "UPDATE_RELATIONSHIP"
const DELETE_RELATIONSHIP = "DELETE_RELATIONSHIP"

// selection actions
const SELECT_COLLECTION = "SELECT_COLLECTION"

// whole project actions
const REPLACE_PROJECT = "REPLACE_PROJECT"
const RESET_PROJECT = "RESET_PROJECT"

export {
    ADD_COLLECTION,
    RENAME_COLLECTION,
    DELETE_COLLECTION,
    MOVE_COLLECTION,
    ADD_FIELD,
    UPDATE_FIELD,
    DELETE_FIELD,
    MOVE_FIELD,
    ADD_RELATIONSHIP,
    UPDATE_RELATIONSHIP,
    DELETE_RELATIONSHIP,
    SELECT_COLLECTION,
    REPLACE_PROJECT,
    RESET_PROJECT
}
