/**
 * ids of the connection handles on a collection card.
 * every field row has a handle on its left and on its right side, ids look like
 * "fld_abc-left". the card header has two extra handles ("card:left", "card:right")
 * that only embed edges end at, they cannot be used to draw a connection.
 */

// handle sides, a field row can connect on its left or right edge
const LEFT_SIDE = "left"
const RIGHT_SIDE = "right"

// prefix of the card level handles
const CARD_HANDLE_PREFIX = "card:"

/**
 * builds the handle id of one side of a field row.
 * @param {string} fieldId id of the field
 * @param {"left" | "right"} side side of the row
 * @returns {string}
 */
function buildFieldHandleId(fieldId, side) {
    return `${fieldId}-${side}`
}

/**
 * builds the handle id of one side of the card header.
 * @param {"left" | "right"} side side of the card
 * @returns {string}
 */
function buildCardHandleId(side) {
    return `${CARD_HANDLE_PREFIX}${side}`
}

/**
 * reads the field id back from a field handle id.
 * @param {string | null | undefined} handleId handle id from a react flow connection
 * @returns {string | null} the field id, or null for card handles and unknown ids
 */
function parseFieldHandleId(handleId) {
    if (!handleId || handleId.startsWith(CARD_HANDLE_PREFIX)) {
        return null
    }

    const separatorIndex = handleId.lastIndexOf("-")

    return separatorIndex > 0 ? handleId.slice(0, separatorIndex) : null
}

export {
    LEFT_SIDE,
    RIGHT_SIDE,
    buildFieldHandleId,
    buildCardHandleId,
    parseFieldHandleId
}
