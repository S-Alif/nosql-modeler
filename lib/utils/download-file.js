/**
 * browser helpers that save data as a file and copy text.
 * they touch the document, so they only run in the browser.
 */

/**
 * saves a blob as a file by clicking a temporary link.
 * @param {string} fileName name the browser saves the file under
 * @param {Blob} blob file content
 */
export function downloadBlob(fileName, blob) {
    const objectUrl = URL.createObjectURL(blob)
    const linkElement = document.createElement("a")

    linkElement.href = objectUrl
    linkElement.download = fileName
    document.body.appendChild(linkElement)
    linkElement.click()
    linkElement.remove()

    // revoke later, some browsers need the url to stay alive for a moment after the click
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

/**
 * saves text as a file.
 * @param {string} fileName name the browser saves the file under, a folder part like "models/" is dropped
 * @param {string} text file content
 * @param {string} [mimeType] mime type of the file
 */
export function downloadTextFile(fileName, text, mimeType = "text/plain") {
    const plainName = fileName.split("/").pop()

    downloadBlob(plainName, new Blob([text], { type: `${mimeType};charset=utf-8` }))
}

/**
 * copies text to the clipboard.
 * @param {string} text text to copy
 * @returns {Promise<boolean>} true when the text was copied
 */
export async function copyTextToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text)

        return true
    } catch {
        return false
    }
}
