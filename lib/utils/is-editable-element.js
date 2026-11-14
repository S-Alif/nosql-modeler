/**
 * dom helper for keyboard shortcuts.
 */

/**
 * tells whether an element (or one of its parents) accepts typed text.
 * keyboard shortcuts must stay quiet while the user is typing in it.
 * @param {EventTarget | null} eventTarget target of a keyboard event
 * @returns {boolean} true for inputs, textareas, selects and editable elements
 */
export function isEditableElement(eventTarget) {
    return (
        eventTarget instanceof Element &&
        eventTarget.closest("input, textarea, select, [contenteditable]") !== null
    )
}
