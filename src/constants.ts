export const FILE_NAME = ".gitignore";

export const MANAGED_START_MARKER = "# ===== vscode-clean-gitignore-generator: DO NOT EDIT BELOW THIS LINE =====";
export const MANAGED_END_MARKER = "# ===== vscode-clean-gitignore-generator: END =====";

// Legacy markers supported for backwards compatibility
export const LEGACY_START_MARKER = "# ===== clean-gitignore-generator: DO NOT EDIT BELOW THIS LINE =====";
export const LEGACY_END_MARKER = "# ===== clean-gitignore-generator: END =====";

export const SECTION_PREFIX = "### ";
export const SECTION_SUFFIX = " ###";

export const GITHUB_API_TREES_URL = "https://api.github.com/repos/github/gitignore/git/trees/main?recursive=1";
export const RAW_GITHUB_CONTENT_URL = "https://raw.githubusercontent.com/github/gitignore/main";

export const CONFIG_SECTION = "cleanGitignore";
export const CONFIG_CACHE_TTL_HOURS = "cacheTTLHours";
export const CONFIG_GITHUB_TOKEN = "githubToken";
export const CONFIG_AUTO_SELECT_DEFAULTS = "autoSelectDefaults";
