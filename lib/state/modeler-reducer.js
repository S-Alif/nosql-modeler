/**
 * reducer and initial state of the modeler.
 * state shape: { project, selectedCollectionId }
 * only `project` is saved to local storage, selection is session only.
 */
import {
    ADD_COLLECTION,
    DELETE_COLLECTION,
    MOVE_COLLECTION,
    RENAME_COLLECTION,
    REPLACE_PROJECT,
    RESET_PROJECT,
    SELECT_COLLECTION
} from "../constants/action-types.js"
import {
    createCollection,
    createEmptyProject
} from "../models/factories.js"
import { loadProject } from "../storage/local-storage.js"
import { generateUniqueName } from "../utils/generate-unique-name.js"

// distance between auto placed collections on the canvas, in pixels
const AUTO_PLACE_OFFSET = 40

/**
 * builds the first state of the app by loading the saved project.
 * used as the lazy initializer of useReducer.
 * @returns {{ project: object, selectedCollectionId: string | null }}
 */
export function createInitialState() {
    return {
        project: loadProject(),
        selectedCollectionId: null
    }
}

/**
 * returns a new project where one collection is replaced by the result of an updater.
 * @param {object} project current project
 * @param {string} collectionId id of the collection to change
 * @param {Function} updateCollection receives the collection, returns the changed collection
 * @returns {object} new project
 */
function updateCollectionById(project, collectionId, updateCollection) {
    return {
        ...project,
        collections: project.collections.map((collection) =>
            collection.id === collectionId ? updateCollection(collection) : collection
        )
    }
}

/**
 * main reducer, one case per action type.
 * @param {object} state current state
 * @param {{ type: string, [key: string]: any }} action dispatched action
 * @returns {object} next state
 */
export function modelerReducer(state, action) {
    switch (action.type) {
        // add a collection, auto name and place it when no name or position is given
        case ADD_COLLECTION: {
            const collectionCount = state.project.collections.length
            const collectionName =
                action.name ??
                generateUniqueName(
                    "collection",
                    state.project.collections.map((collection) => collection.name)
                )
            const collectionPosition = action.position ?? {
                x: 80 + collectionCount * AUTO_PLACE_OFFSET,
                y: 80 + collectionCount * AUTO_PLACE_OFFSET
            }
            const newCollection = createCollection(collectionName, collectionPosition)

            return {
                project: {
                    ...state.project,
                    collections: [...state.project.collections, newCollection]
                },
                selectedCollectionId: newCollection.id
            }
        }

        // rename one collection
        case RENAME_COLLECTION: {
            return {
                ...state,
                project: updateCollectionById(
                    state.project,
                    action.collectionId,
                    (collection) => ({ ...collection, name: action.name })
                )
            }
        }

        // delete a collection and every relationship that points to it
        case DELETE_COLLECTION: {
            return {
                project: {
                    ...state.project,
                    collections: state.project.collections.filter(
                        (collection) => collection.id !== action.collectionId
                    ),
                    relationships: state.project.relationships.filter(
                        (relationship) =>
                            relationship.sourceCollectionId !== action.collectionId &&
                            relationship.targetCollectionId !== action.collectionId
                    )
                },
                selectedCollectionId:
                    state.selectedCollectionId === action.collectionId
                        ? null
                        : state.selectedCollectionId
            }
        }

        // move a collection on the canvas
        case MOVE_COLLECTION: {
            return {
                ...state,
                project: updateCollectionById(
                    state.project,
                    action.collectionId,
                    (collection) => ({ ...collection, position: action.position })
                )
            }
        }

        // select a collection, null clears the selection
        case SELECT_COLLECTION: {
            return {
                ...state,
                selectedCollectionId: action.collectionId
            }
        }

        // replace everything, used by import in batch 7
        case REPLACE_PROJECT: {
            return {
                project: action.project,
                selectedCollectionId: null
            }
        }

        // start over with an empty project
        case RESET_PROJECT: {
            return {
                project: createEmptyProject(),
                selectedCollectionId: null
            }
        }

        default: {
            return state
        }
    }
}
