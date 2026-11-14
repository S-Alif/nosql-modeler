# theme and branding

how the interface looks and where to change it. read this before restyling anything.

## look

a drafting table: a quiet canvas with a dot grid, white panels, ink colored text and one violet accent. names and types (collection names, field names, types) use a monospace font because they are code, everything else uses a sans font.

## where things live

| what | where |
| ---- | ----- |
| all colors, fonts, radii, shadows and panel sizes | the `:root` block at the top of styles/global.css |
| dark theme colors | the `@media (prefers-color-scheme: dark)` block right below it |
| fonts (Instrument Sans and JetBrains Mono) | the `<link>` tags in index.html, the css falls back to system fonts |
| app name in the toolbar | `APP_NAME` in lib/constants/app-info.js |
| browser tab title | `<title>` in index.html (keep it equal to `APP_NAME`) |
| github link in the toolbar | `PROJECT_GITHUB_URL` in lib/constants/app-info.js |
| toolbar component and logo mark | components/toolbar/app-toolbar.jsx |
| relationship edge colors | `REFERENCE_EDGE_COLOR` and `EMBED_EDGE_COLOR` in lib/constants/canvas-config.js |

## github link

`PROJECT_GITHUB_URL` is an empty string. while it is empty the toolbar shows a dashed "GitHub" placeholder, put your repository address in it and the placeholder becomes a real link that opens in a new tab.

## light and dark

the theme follows the operating system setting. react flow gets the same setting through `colorMode="system"` in diagram-canvas.jsx, and its colors (grid dots, controls, minimap) are pointed at our variables in the `.react-flow` block of global.css. to force one theme, delete the other block (for a light only app, remove the dark media query).

## changing the colors

- change the accent: `--color-accent`, `--color-accent-hover` and `--color-accent-soft` (in both themes)
- the edge colors are plain values in canvas-config.js because react flow draws them inside svg, they are mid tones that work on both themes

## debugging

- fonts look like the system font: the browser is offline or blocked fonts.googleapis.com, the fallback is expected
- react flow controls or minimap look wrong in one theme: check the `--xy-*` variables in the `.react-flow` block of global.css
- a color is wrong in dark mode only: a hard coded color is used somewhere instead of a variable, search global.css for `#`
