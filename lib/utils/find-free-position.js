/**
 * position helper for new collection cards.
 */

/**
 * moves a position diagonally until no existing card sits on it,
 * so cards added one after another do not pile up on the same spot.
 * @param {{ x: number, y: number }} desiredPosition where the card should go
 * @param {Array<{ x: number, y: number }>} occupiedPositions positions of the existing cards
 * @param {number} cascadeOffset pixels to move on each step
 * @returns {{ x: number, y: number }} the first free position
 */
export function findFreePosition(desiredPosition, occupiedPositions, cascadeOffset) {
    const overlapDistance = cascadeOffset / 2

    /** true when an existing card is closer than the overlap distance in both directions */
    function isOccupied(position) {
        return occupiedPositions.some(
            (occupiedPosition) =>
                Math.abs(occupiedPosition.x - position.x) < overlapDistance &&
                Math.abs(occupiedPosition.y - position.y) < overlapDistance
        )
    }

    let candidatePosition = desiredPosition

    while (isOccupied(candidatePosition)) {
        candidatePosition = {
            x: candidatePosition.x + cascadeOffset,
            y: candidatePosition.y + cascadeOffset
        }
    }

    return candidatePosition
}
