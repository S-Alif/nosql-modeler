# naming rules

how collection and field names are checked. the rules follow the mongodb naming restrictions plus the common convention of camelCase or snake_case names.

## rules

| rule | collections | fields |
| ---- | ----------- | ------ |
| allowed characters | letters, numbers, underscore | letters, numbers, underscore |
| must start with | a letter | a letter or underscore |
| max length | 120 | 64 |
| must be unique | across the project | among the fields at the same level |
| empty name | not allowed | not allowed |

so these are rejected:

- `Collection name` (space) and `Collection-name` (hyphen), the error suggests snake_case or camelCase
- `user.profile` (dot), `price$` ($), `café` (other characters)
- `1users` (starts with a number), and `_users` for collections
- anything starting with `system.` (it has a dot)

and these are fine: `users`, `orderItems`, `order_items`, `Users`, and `_meta` for a field.

lowercase is not forced. camelCase, snake_case and PascalCase all pass, to make it stricter change the patterns (see below).

leading and trailing spaces are trimmed before checking.

## where it lives

| file | purpose |
| ---- | ------- |
| lib/constants/naming-rules.js | the patterns and length limits, change the rules here |
| lib/validators/name-characters-validator.js | character check with a friendly message for spaces, hyphens, dots and $ |
| lib/validators/collection-name-validator.js | `validateCollectionName(name, otherCollectionNames)` |
| lib/validators/field-name-validator.js | `validateFieldName(name, siblingNames)` |

both validators return an error message, or `null` when the name is valid.

## where it is used

- sidebar rename (components/sidebar/collection-sidebar-item.jsx): shows the error on enter and keeps the input open
- inspector name input (components/inspector/field-row.jsx): shows the error while typing and never saves an invalid name
- auto generated names (`collection_1`, `field_1`) always pass
- names saved before these rules existed are not changed, but an invalid saved name shows the error in red when its field is shown in the inspector

## making the rules stricter

- force lowercase collection names: change `ALLOWED_NAME_CHARACTERS_PATTERN` or add a collection only pattern, for example `/^[a-z][a-z0-9_]*$/`, and use it in `collection-name-validator.js`
- change length limits: `COLLECTION_NAME_MAX_LENGTH` and `FIELD_NAME_MAX_LENGTH`
