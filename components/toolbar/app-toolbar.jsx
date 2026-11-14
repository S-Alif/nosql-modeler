/**
 * top toolbar: the app name on the left and the github link on the right.
 * the link address comes from lib/constants/app-info.js, until it is set a dashed
 * placeholder is shown so the spot is easy to find.
 */
import { APP_NAME, PROJECT_GITHUB_URL } from "../../lib/constants/app-info.js"

/**
 * small logo mark: three linked collections.
 * @returns {JSX.Element}
 */
function ToolbarLogo() {
    return (
        <svg
            className="toolbar-logo"
            viewBox="0 0 26 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <rect x="2" y="3" width="9" height="7" rx="2" />
            <rect x="15" y="3" width="9" height="7" rx="2" />
            <rect x="8.5" y="16" width="9" height="7" rx="2" />
            <path d="M6.5 10v2.5h6.5V16M19.5 10v2.5H13" />
        </svg>
    )
}

/**
 * toolbar shown above the three panels.
 * @returns {JSX.Element}
 */
function AppToolbar() {
    return (
        <header className="app-toolbar">
            {/* app name and logo */}
            <div className="toolbar-brand">
                <ToolbarLogo />
                <span>{APP_NAME}</span>
            </div>

            <div className="toolbar-spacer"></div>

            {/* github link, add the address in lib/constants/app-info.js */}
            {PROJECT_GITHUB_URL ? (
                <a
                    className="toolbar-link"
                    href={PROJECT_GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                >
                    GitHub
                </a>
            ) : (
                <span
                    className="toolbar-link toolbar-link-unset"
                    title="set PROJECT_GITHUB_URL in lib/constants/app-info.js"
                >
                    GitHub
                </span>
            )}
        </header>
    )
}

export default AppToolbar
