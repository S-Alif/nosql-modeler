/**
 * small javascript code writer used by the exporters.
 * it prints values the way the code style of this project asks for: 4 spaces, double quotes,
 * no semicolons, no trailing commas, and one key per line in objects with more than one key.
 *
 * values it understands:
 *  - strings, numbers, booleans and null
 *  - arrays
 *  - plain objects
 *  - raw code (raw("String")), printed as it is
 *  - code objects (codeObject([...])), objects whose keys can carry a comment line
 *  - calls (call("new Schema", [...])), a name with arguments
 */

// the indent of one level
const INDENT = "    "

// arrays whose items are all short and simple stay on one line up to this width
const MAX_INLINE_ARRAY_WIDTH = 72

// keys that can be written without quotes
const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/** a piece of code that is printed as it is, like String or Date.now */
class RawCode {
    /**
     * @param {string} code the code text
     */
    constructor(code) {
        this.code = code
    }
}

/** an object whose keys can have a comment line above them */
class CodeObject {
    /**
     * @param {Array<{ key: string, value: any, comment?: string }>} entries keys in print order
     */
    constructor(entries) {
        this.entries = entries
    }
}

/** a call or constructor with arguments, like new Schema({ ... }, { ... }) */
class CallExpression {
    /**
     * @param {string} callee what is called, for example "new Schema"
     * @param {any[]} args arguments in order
     */
    constructor(callee, args) {
        this.callee = callee
        this.args = args
    }
}

/**
 * creates a call, its arguments are printed on the line the call starts on.
 * @param {string} callee what is called, for example "new Schema"
 * @param {any[]} args arguments in order
 * @returns {CallExpression}
 */
export function call(callee, args) {
    return new CallExpression(callee, args)
}

/**
 * marks a piece of code that must not be quoted.
 * @param {string} code the code text, for example "mongoose.Schema.Types.ObjectId"
 * @returns {RawCode}
 */
export function raw(code) {
    return new RawCode(code)
}

/**
 * creates an object whose keys can have comments.
 * @param {Array<{ key: string, value: any, comment?: string }>} entries keys in print order
 * @returns {CodeObject}
 */
export function codeObject(entries) {
    return new CodeObject(entries)
}

/**
 * prints a key, quoted only when it has to be.
 * @param {string} key object key
 * @returns {string}
 */
function printKey(key) {
    return IDENTIFIER_PATTERN.test(key) ? key : JSON.stringify(key)
}

/**
 * turns a comment into one line of text.
 * @param {string} comment comment text
 * @returns {string}
 */
function toSingleLineComment(comment) {
    return comment.replace(/\s+/g, " ").trim()
}

/**
 * tells whether a value prints on a single short line by itself.
 * @param {any} value value to check
 * @returns {boolean}
 */
function isSimpleValue(value) {
    return (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value instanceof RawCode
    )
}

/**
 * prints an object from a list of entries.
 * @param {Array<{ key: string, value: any, comment?: string }>} entries keys in print order
 * @param {number} level indent level of the line the object starts on
 * @returns {string}
 */
function printEntries(entries, level) {
    if (entries.length === 0) {
        return "{}"
    }

    const innerIndent = INDENT.repeat(level + 1)
    const printedEntries = entries.map((entry) => ({
        ...entry,
        printedValue: printValue(entry.value, level + 1)
    }))

    // one key without a comment stays on one line when its value does
    if (
        printedEntries.length === 1 &&
        !printedEntries[0].comment &&
        !printedEntries[0].printedValue.includes("\n")
    ) {
        return `{ ${printKey(printedEntries[0].key)}: ${printedEntries[0].printedValue} }`
    }

    const lines = printedEntries.flatMap((entry, entryPosition) => {
        const separator = entryPosition < printedEntries.length - 1 ? "," : ""
        const commentLine = entry.comment
            ? [`${innerIndent}// ${toSingleLineComment(entry.comment)}`]
            : []

        return [
            ...commentLine,
            `${innerIndent}${printKey(entry.key)}: ${entry.printedValue}${separator}`
        ]
    })

    return `{\n${lines.join("\n")}\n${INDENT.repeat(level)}}`
}

/**
 * prints a value as javascript code.
 * @param {any} value value to print
 * @param {number} [level] indent level of the line the value starts on
 * @returns {string} code, nested lines are indented relative to level
 */
export function printValue(value, level = 0) {
    if (value instanceof RawCode) {
        return value.code
    }

    if (value instanceof CodeObject) {
        return printEntries(value.entries, level)
    }

    if (value instanceof CallExpression) {
        return `${value.callee}(${value.args.map((argument) => printValue(argument, level)).join(", ")})`
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return "[]"
        }

        if (value.every(isSimpleValue)) {
            const inlineText = `[${value.map((item) => printValue(item)).join(", ")}]`

            if (inlineText.length <= MAX_INLINE_ARRAY_WIDTH) {
                return inlineText
            }
        }

        // a single item that prints on several lines opens on the same line: [{ ... }]
        const printedItems = value.map((item) => printValue(item, level + 1))

        if (value.length === 1) {
            return `[${printValue(value[0], level)}]`
        }

        const innerIndent = INDENT.repeat(level + 1)

        return `[\n${printedItems.map((item) => `${innerIndent}${item}`).join(",\n")}\n${INDENT.repeat(level)}]`
    }

    if (value !== null && typeof value === "object") {
        return printEntries(
            Object.entries(value).map(([key, entryValue]) => ({
                key,
                value: entryValue
            })),
            level
        )
    }

    return JSON.stringify(value)
}
