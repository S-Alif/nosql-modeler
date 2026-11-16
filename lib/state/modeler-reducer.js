/**
 * reducer and initial state of the modeler.
 * state shape: { project, selectedCollectionId, selectedRelationshipId }
 * only `project` is saved to local storage, selection is session only.
 * selecting a relationship (a thread on the canvas) also selects its source collection,
 * so the inspector shows it. the relationship id can outlive its relationship (a field
 * delete removes it), so always look it up before using it.
 */
import {
    ADD_COLLECTION,
    ADD_FIELD,
    ADD_RELATIONSHIP,
    DELETE_COLLECTION,
    DELETE_FIELD,
    DELETE_RELATIONSHIP,
    MOVE_COLLECTION,
    MOVE_FIELD,
    RENAME_COLLECTION,
    REPLACE_PROJECT,
    RESET_PROJECT,
    SELECT_COLLECTION,
    SELECT_RELATIONSHIP,
    UPDATE_FIELD,
    UPDATE_RELATIONSHIP
} from "../constants/action-types.js"
import {
    createCollection,
    createEmptyProject,
    createField
} from "../models/factories.js"
import { loadProject } from "../storage/local-storage.js"
import {
    addFieldToTree,
    deleteFieldFromTree,
    getSiblingFields,
    moveFieldInTree,
    updateFieldInTree
} from "../utils/field-tree.js"
import { generateUniqueName } from "../utils/generate-unique-name.js"
import { pruneOrphanRelationships } from "../utils/prune-relationships.js"
import {
    addRelationshipToProject,
    updateRelationshipInProject
} from "../utils/relationship-operations.js"

// distance between auto placed collections on the canvas, in pixels
const AUTO_PLACE_OFFSET = 40

/**
 * builds the first state of the app by loading the saved project.
 * used as the lazy initializer of useReducer.
 * @returns {{ project: object, selectedCollectionId: string | null, selectedRelationshipId: string | null }}
 */
export function createInitialState() {
    return {
        project: loadProject(),
        selectedCollectionId: null,
        selectedRelationshipId: null
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
 * returns a new project where the field list of one collection is replaced
 * by the result of an updater.
 * @param {object} project current project
 * @param {string} collectionId id of the collection to change
 * @param {Function} updateFields receives the top level fields, returns the changed fields
 * @returns {object} new project
 */
function updateCollectionFields(project, collectionId, updateFields) {
    return updateCollectionById(project, collectionId, (collection) => ({
        ...collection,
        fields: updateFields(collection.fields)
    }))
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
                selectedCollectionId: newCollection.id,
                selectedRelationshipId: null
            }
        }

        // rename one collection
        case RENAME_COLLECTION: {
            return {
                ...state,
                project: updateCollectionById(
                    state.project,
                    action.collectionId,
                    (collection) => ({
                        ...collection,
                        name: action.name
                    })
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
                        : state.selectedCollectionId,
                selectedRelationshipId: state.selectedRelationshipId
            }
        }

        // move a collection on the canvas
        case MOVE_COLLECTION: {
            return {
                ...state,
                project: updateCollectionById(
                    state.project,
                    action.collectionId,
                    (collection) => ({
                        ...collection,
                        position: action.position
                    })
                )
            }
        }

        // add a field at the top level, or inside an object field or an array of objects
        case ADD_FIELD: {
            const targetCollection = state.project.collections.find(
                (collection) => collection.id === action.collectionId
            )

            if (!targetCollection) {
                return state
            }

            const parentFieldId = action.parentFieldId ?? null
            const siblingNames = getSiblingFields(targetCollection.fields, parentFieldId).map(
                (siblingField) => siblingField.name
            )
            const newField = createField(generateUniqueName("field", siblingNames))

            return {
                ...state,
                project: updateCollectionFields(
                    state.project,
                    action.collectionId,
                    (fields) => addFieldToTree(fields, parentFieldId, newField)
                )
            }
        }

        // change properties of one field (name, type, required, default value, item type)
        case UPDATE_FIELD: {
            return {
                ...state,
                project: pruneOrphanRelationships(
                    updateCollectionFields(
                        state.project,
                        action.collectionId,
                        (fields) => updateFieldInTree(fields, action.fieldId, action.changes)
                    )
                )
            }
        }

        // delete a field and everything nested inside it
        case DELETE_FIELD: {
            return {
                ...state,
                project: pruneOrphanRelationships(
                    updateCollectionFields(
                        state.project,
                        action.collectionId,
                        (fields) => deleteFieldFromTree(fields, action.fieldId)
                    )
                )
            }
        }

        // move a field one place up (-1) or down (1) among its siblings
        case MOVE_FIELD: {
            return {
                ...state,
                project: updateCollectionFields(
                    state.project,
                    action.collectionId,
                    (fields) => moveFieldInTree(fields, action.fieldId, action.direction)
                )
            }
        }

        // connect two existing fields (action.relationship holds the details), then select the source collection
        case ADD_RELATIONSHIP: {
            const projectWithRelationship = addRelationshipToProject(
                state.project,
                action.relationship
            )

            if (projectWithRelationship === state.project) {
                return state
            }

            return {
                project: projectWithRelationship,
                selectedCollectionId: action.relationship.sourceCollectionId,
                selectedRelationshipId: null
            }
        }

        // change the type, source field, target collection or target field of a relationship
        case UPDATE_RELATIONSHIP: {
            const updatedProject = updateRelationshipInProject(
                state.project,
                action.relationshipId,
                action.changes
            )

            if (updatedProject === state.project) {
                return state
            }

            return {
                ...state,
                project: updatedProject
            }
        }

        // delete a relationship, both fields stay
        case DELETE_RELATIONSHIP: {
            return {
                ...state,
                selectedRelationshipId:
                    state.selectedRelationshipId === action.relationshipId
                        ? null
                        : state.selectedRelationshipId,
                project: {
                    ...state.project,
                    relationships: state.project.relationships.filter(
                        (relationship) => relationship.id !== action.relationshipId
                    )
                }
            }
        }

        // select a collection, null clears the selection, a selected relationship is deselected
        case SELECT_COLLECTION: {
            return {
                ...state,
                selectedCollectionId: action.collectionId,
                selectedRelationshipId: null
            }
        }

        // select a relationship (its thread on the canvas), its source collection is selected too
        // so the inspector shows it. a missing id or null clears the relationship selection
        case SELECT_RELATIONSHIP: {
            const selectedRelationship = state.project.relationships.find(
                (relationship) => relationship.id === action.relationshipId
            )

            if (!selectedRelationship) {
                return {
                    ...state,
                    selectedRelationshipId: null
                }
            }

            return {
                ...state,
                selectedCollectionId: selectedRelationship.sourceCollectionId,
                selectedRelationshipId: selectedRelationship.id
            }
        }

        // replace everything, used by import in batch 7
        case REPLACE_PROJECT: {
            return {
                project: action.project,
                selectedCollectionId: null,
                selectedRelationshipId: null
            }
        }

        // start over with an empty project
        case RESET_PROJECT: {
            return {
                project: createEmptyProject(),
                selectedCollectionId: null,
                selectedRelationshipId: null
            }
        }

        default: {
            return state
        }
    }
}
