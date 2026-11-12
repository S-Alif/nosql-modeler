/**
 * vite configuration for mongo modeler.
 * the app is a pure client side spa, so only the react plugin is needed.
 * @see https://vite.dev/config/
 */
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
    plugins: [react()]
})
