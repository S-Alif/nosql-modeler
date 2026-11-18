/**
 * builds a zip file in memory, so several export files can be downloaded as one.
 * it uses the "stored" method (no compression), which every zip reader understands
 * and keeps this file free of libraries. the text files are small, so the size does not matter.
 */

// lookup table of the crc32 checksum every zip entry needs
const CRC_TABLE = Array.from({ length: 256 }, (unused, tableIndex) => {
    let value = tableIndex

    for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }

    return value >>> 0
})

/**
 * calculates the crc32 checksum of some bytes.
 * @param {Uint8Array} bytes data to check
 * @returns {number} unsigned 32 bit checksum
 */
export function calculateCrc32(bytes) {
    let checksum = 0xffffffff

    for (const byte of bytes) {
        checksum = CRC_TABLE[(checksum ^ byte) & 0xff] ^ (checksum >>> 8)
    }

    return (checksum ^ 0xffffffff) >>> 0
}

/**
 * converts a date to the two 16 bit values zip uses for its time stamps.
 * @param {Date} date date to convert
 * @returns {{ dosTime: number, dosDate: number }}
 */
function toDosDateTime(date) {
    return {
        dosTime: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
        dosDate: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    }
}

/**
 * creates a zip file.
 * @param {Array<{ name: string, content: string }>} files files to put in the zip, names may hold folders like "models/users.js"
 * @param {Date} [modifiedDate] time stamp of every file, defaults to now
 * @returns {Uint8Array} the bytes of the zip file
 */
export function createZip(files, modifiedDate = new Date()) {
    const encoder = new TextEncoder()
    const { dosTime, dosDate } = toDosDateTime(modifiedDate)
    const localParts = []
    const centralParts = []
    let offset = 0

    files.forEach((file) => {
        const nameBytes = encoder.encode(file.name)
        const contentBytes = encoder.encode(file.content)
        const checksum = calculateCrc32(contentBytes)

        // local file header, then the file data
        const localHeader = new DataView(new ArrayBuffer(30))

        localHeader.setUint32(0, 0x04034b50, true)
        localHeader.setUint16(4, 20, true)
        localHeader.setUint16(6, 0x0800, true)
        localHeader.setUint16(8, 0, true)
        localHeader.setUint16(10, dosTime, true)
        localHeader.setUint16(12, dosDate, true)
        localHeader.setUint32(14, checksum, true)
        localHeader.setUint32(18, contentBytes.length, true)
        localHeader.setUint32(22, contentBytes.length, true)
        localHeader.setUint16(26, nameBytes.length, true)
        localHeader.setUint16(28, 0, true)
        localParts.push(new Uint8Array(localHeader.buffer), nameBytes, contentBytes)

        // central directory entry, it points back at the local header
        const centralHeader = new DataView(new ArrayBuffer(46))

        centralHeader.setUint32(0, 0x02014b50, true)
        centralHeader.setUint16(4, 20, true)
        centralHeader.setUint16(6, 20, true)
        centralHeader.setUint16(8, 0x0800, true)
        centralHeader.setUint16(10, 0, true)
        centralHeader.setUint16(12, dosTime, true)
        centralHeader.setUint16(14, dosDate, true)
        centralHeader.setUint32(16, checksum, true)
        centralHeader.setUint32(20, contentBytes.length, true)
        centralHeader.setUint32(24, contentBytes.length, true)
        centralHeader.setUint16(28, nameBytes.length, true)
        centralHeader.setUint32(42, offset, true)
        centralParts.push(new Uint8Array(centralHeader.buffer), nameBytes)

        offset += 30 + nameBytes.length + contentBytes.length
    })

    const centralSize = centralParts.reduce((total, part) => total + part.length, 0)

    // end of central directory record
    const endRecord = new DataView(new ArrayBuffer(22))

    endRecord.setUint32(0, 0x06054b50, true)
    endRecord.setUint16(8, files.length, true)
    endRecord.setUint16(10, files.length, true)
    endRecord.setUint32(12, centralSize, true)
    endRecord.setUint32(16, offset, true)

    const allParts = [...localParts, ...centralParts, new Uint8Array(endRecord.buffer)]
    const zipBytes = new Uint8Array(allParts.reduce((total, part) => total + part.length, 0))
    let writePosition = 0

    allParts.forEach((part) => {
        zipBytes.set(part, writePosition)
        writePosition += part.length
    })

    return zipBytes
}
