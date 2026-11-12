/**
 * diagram canvas built on react flow.
 * react flow keeps its own node list so dragging stays smooth.
 * the node list is rebuilt from the project whenever collections or selection
 * change, and the final position is saved to the project when a drag ends.
 */
import "@xyflow/react/dist/style.css"
import { useEffect } from "react"
import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    useNodesState
} from "@xyflow/react"
import {
    CANVAS_MAX_ZOOM,
    CANVAS_MIN_ZOOM,
    COLLECTION_NODE_TYPE
} from "../../lib/constants/canvas-config.js"
import {
    MOVE_COLLECTION,
    SELECT_COLLECTION
} from "../../lib/constants/action-types.js"
import { useModeler } from "../../lib/hooks/use-modeler.js"
import { collectionsToNodes } from "../../lib/utils/project-to-nodes.js"
import CollectionNode from "./collection-node.jsx"

// maps node type names to components, must live outside the component so it stays stable
const nodeTypes = { [COLLECTION_NODE_TYPE]: CollectionNode }

/**
 * canvas with one draggable card per collection.
 * @returns {JSX.Element}
 */
function DiagramCanvas() {
    const { state, dispatch } = useModeler()
    const { collections } = state.project
    const { selectedCollectionId } = state

    const [flowNodes, setFlowNodes, handleNodesChange] = useNodesState(
        collectionsToNodes(collections, selectedCollectionId)
    )

    // rebuild react flow nodes when collections or selection change
    useEffect(() => {
        setFlowNodes((previousNodes) =>
            collectionsToNodes(collections, selectedCollectionId, previousNodes)
        )
    }, [collections, selectedCollectionId, setFlowNodes])

    /** selects the clicked collection */
    function handleNodeClick(event, node) {
        dispatch({
            type: SELECT_COLLECTION,
            collectionId: node.id
        })
    }

    /** clears the selection when the empty canvas is clicked */
    function handlePaneClick() {
        dispatch({
            type: SELECT_COLLECTION,
            collectionId: null
        })
    }

    /** saves the final position of a dragged collection to the project */
    function handleNodeDragStop(event, node) {
        dispatch({
            type: MOVE_COLLECTION,
            collectionId: node.id,
            position: {
                x: Math.round(node.position.x),
                y: Math.round(node.position.y)
            }
        })
    }

    return (
        <div className="diagram-canvas">
            {/* react flow diagram */}
            <ReactFlow
                nodes={flowNodes}
                nodeTypes={nodeTypes}
                onNodesChange={handleNodesChange}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                onNodeDragStop={handleNodeDragStop}
                deleteKeyCode={null}
                minZoom={CANVAS_MIN_ZOOM}
                maxZoom={CANVAS_MAX_ZOOM}
                colorMode="dark"
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>

            {/* empty canvas hint */}
            {collections.length === 0 && (
                <div className="canvas-empty-hint">
                    no collections yet, add one from the sidebar
                </div>
            )}
        </div>
    )
}

export default DiagramCanvas
