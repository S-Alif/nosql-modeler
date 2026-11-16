/**
 * constants for field options: the mongoose style rules a field can carry
 * (enum, length, min and max, pattern, text clean up) and the ttl (time to live) setting.
 * options belong to the type of the values a field holds, which is the item type for arrays.
 */

// option categories, one per group of value types that share the same options
const TEXT_OPTION_CATEGORY = "text"
const INTEGER_OPTION_CATEGORY = "integer"
const FLOAT_OPTION_CATEGORY = "float"
const DATE_OPTION_CATEGORY = "date"

// value types of each category
const OPTION_CATEGORY_BY_VALUE_TYPE = {
    string: TEXT_OPTION_CATEGORY,
    int: INTEGER_OPTION_CATEGORY,
    long: INTEGER_OPTION_CATEGORY,
    double: FLOAT_OPTION_CATEGORY,
    decimal: FLOAT_OPTION_CATEGORY,
    date: DATE_OPTION_CATEGORY
}

// the options each category offers, "ttlValue" stands for the whole ttl setting (value and unit)
const OPTION_KEYS_BY_CATEGORY = {
    [TEXT_OPTION_CATEGORY]: ["enumValues", "minLength", "maxLength", "match", "trim", "lowercase", "uppercase"],
    [INTEGER_OPTION_CATEGORY]: ["enumValues", "min", "max"],
    [FLOAT_OPTION_CATEGORY]: ["enumValues", "min", "max"],
    [DATE_OPTION_CATEGORY]: ["min", "max", "ttlValue"]
}

// units of the ttl setting and how many seconds each one is
const TTL_UNITS = [
    {
        name: "seconds",
        seconds: 1
    },
    {
        name: "minutes",
        seconds: 60
    },
    {
        name: "hours",
        seconds: 3600
    },
    {
        name: "days",
        seconds: 86400
    }
]

// unit a new ttl setting starts with
const DEFAULT_TTL_UNIT = "days"

// the largest value mongodb accepts for expireAfterSeconds (a 32 bit integer)
const MAX_TTL_SECONDS = 2147483647

export {
    TEXT_OPTION_CATEGORY,
    INTEGER_OPTION_CATEGORY,
    FLOAT_OPTION_CATEGORY,
    DATE_OPTION_CATEGORY,
    OPTION_CATEGORY_BY_VALUE_TYPE,
    OPTION_KEYS_BY_CATEGORY,
    TTL_UNITS,
    DEFAULT_TTL_UNIT,
    MAX_TTL_SECONDS
}
