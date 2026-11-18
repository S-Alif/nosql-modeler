/**
 * theme switcher: three buttons in the toolbar, light, auto (follow the system) and dark.
 * the choice is saved, see components/providers/theme-provider.jsx.
 */
import { THEME_OPTIONS } from "../../lib/constants/theme-config.js"
import { useTheme } from "../../lib/hooks/use-theme.js"

/**
 * theme switcher.
 * @returns {JSX.Element}
 */
function ThemeSwitcher() {
    const { themePreference, setThemePreference } = useTheme()

    return (
        <div
            className="theme-switcher"
            role="group"
            aria-label="Theme"
        >
            {THEME_OPTIONS.map((themeOption) => (
                <button
                    key={themeOption.value}
                    type="button"
                    className={
                        themeOption.value === themePreference
                            ? "theme-switcher-button theme-switcher-button-active"
                            : "theme-switcher-button"
                    }
                    aria-pressed={themeOption.value === themePreference}
                    title={themeOption.title}
                    onClick={() => setThemePreference(themeOption.value)}
                >
                    {themeOption.label}
                </button>
            ))}
        </div>
    )
}

export default ThemeSwitcher
