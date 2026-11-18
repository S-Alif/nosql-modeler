# theme and branding

how the interface looks and where to change it. read this before restyling anything.

## look

a drafting table: a quiet canvas with a dot grid, white panels, ink colored text and one green accent (a deep green in the light theme, a bright mint green in the dark theme, on green tinted grays). names and types (collection names, field names, types) use a monospace font because they are code, everything else uses a sans font.

## where things live

| what | where |
| ---- | ----- |
| all colors, fonts, radii, shadows and panel sizes | the `:root` block at the top of styles/global.css |
| dark theme colors | the dark blocks right below it, `@media (prefers-color-scheme: dark)` and `:root[data-theme="dark"]`, keep both identical |
| theme switcher | components/toolbar/theme-switcher.jsx, buttons listed in `THEME_OPTIONS` in lib/constants/theme-config.js |
| theme state and saving | components/providers/theme-provider.jsx, lib/hooks/use-theme.js, lib/storage/theme-storage.js |
| fonts (Instrument Sans and JetBrains Mono) | the `<link>` tags in index.html, the css falls back to system fonts |
| app name in the toolbar | `APP_NAME` in lib/constants/app-info.js |
| browser tab title | `<title>` in index.html (keep it equal to `APP_NAME`) |
| github link in the toolbar | `PROJECT_GITHUB_URL` in lib/constants/app-info.js |
| toolbar component and logo mark | components/toolbar/app-toolbar.jsx |
| relationship edge colors | `REFERENCE_EDGE_COLOR` and `EMBED_EDGE_COLOR` in lib/constants/canvas-config.js |

## github link

`PROJECT_GITHUB_URL` is an empty string. while it is empty the toolbar shows a dashed "GitHub" placeholder, put your repository address in it and the placeholder becomes a real link that opens in a new tab.

## light and dark

the toolbar has a switcher with three buttons: **Light**, **Auto** and **Dark**. auto follows the operating system setting and is the default. the choice is saved in local storage under `mongo-modeler:theme`.

how it works:

- `ThemeProvider` keeps the preference and writes it to the `<html>` element as `data-theme="light"` or `data-theme="dark"`. for auto it removes the attribute
- the css has the light values in `:root`. the dark values exist twice: inside `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])` (auto, or the system is dark and nothing was picked) and in `:root[data-theme="dark"]` (picked on purpose). css cannot share the two, so **change both when you change a dark color**
- `color-scheme` is set with each theme so scrollbars and form controls match
- react flow gets the preference through `colorMode={themePreference}` in diagram-canvas.jsx, and its colors (grid dots, controls, minimap) are pointed at our variables in the `.react-flow` block of global.css
- a small script in index.html applies a saved light or dark choice before the first paint, so the page does not flash. it reads the same storage key as `THEME_STORAGE_KEY`

## changing the colors

- change the accent: `--color-accent`, `--color-accent-hover`, `--color-accent-soft` and the glow in `--shadow-card-selected` (in the light block and in both dark blocks)
- the green palette: light accent `#15803d` (hover `#116b32`), dark accent `#4ade80` (hover `#6ee79a`), backgrounds, panels and borders are green tinted grays
- the edge colors are plain values in canvas-config.js because react flow draws them inside svg, they are mid tones that work on both themes

## debugging

- fonts look like the system font: the browser is offline or blocked fonts.googleapis.com, the fallback is expected
- react flow controls or minimap look wrong in one theme: check the `--xy-*` variables in the `.react-flow` block of global.css
- a color is wrong in dark mode only: a hard coded color is used somewhere instead of a variable, search global.css for `#`
- dark mode looks different when picked than when it comes from the system: the two dark blocks are not identical, compare them
- the switcher does nothing after a reload: local storage is blocked (private mode), the preference cannot be saved, the console shows "theme storage error"
