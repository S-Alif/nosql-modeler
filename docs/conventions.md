# code conventions

follow these in every file so the codebase stays consistent and easy to debug.

## language and files

- plain javascript only, never typescript. use jsdoc for types
- file names are `file-name.extension` (kebab-case)
- `.jsx` for pages and components, `.js` for everything else
- no src folder. components are grouped by feature, lib is grouped by purpose

## formatting

- 4 space indentation
- no semicolons
- double quotes for all strings, backticks only when `${}` is needed
- no trailing commas
- a component with more than two props: one prop per line
- an object with more than one key: one key per line

```jsx
<CollectionNode
    id="users"
    name="users"
    fields={fields}
/>
```

## comments and docs

- every file starts with a comment explaining what it is for
- every function and component has a jsdoc block (description, params, returns)
- comments are lowercase and short
- in .jsx, add a simple section comment before each part of the screen, for example `{/* collection list */}`, so a part is easy to find while debugging
- when a feature is finished, document it in docs/ so you can debug or extend it later

## naming

- descriptive, developer like variable names (`selectedCollectionId`, not `sid`)
- colors are always spelled "color"
