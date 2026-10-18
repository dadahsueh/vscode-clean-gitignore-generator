# Change Log

All notable changes to the "Clean GitIgnore Generator" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-17

### Added
- **Official GitHub Templates**: Direct integration with [github/gitignore](https://github.com/github/gitignore) covering 300+ templates (root languages, `Global/` OS and tools, and `community/` frameworks).
- **Interactive Section Management**: Clear section header markers (e.g. `### Node ###`) allowing intuitive addition and removal of template sections upon re-running the generator.
- **Dynamic Selection Pinning**: Selected items in the template picker automatically float to the top under a "Selected" group with live count tracking.
- **Top Custom Rules Preservation**: Rules, comments, and environment variable ignores placed outside the managed boundary markers are strictly preserved and never overwritten.
- **Explorer Context Menu Integration**: Generate `.gitignore` directly by right-clicking folders or files in the VS Code file explorer.
- **Multi-Root Workspace & Untitled Document Support**: Target folder selection prompt for multi-root workspaces, and untitled document generation when no workspace folder is open.
- **Two-Tier Resilient Caching**: In-memory and persistent `globalState` cache with configurable TTL (`cleanGitignore.cacheTTLHours`).
- **Offline & Rate-Limit Fallback**: Bundled fallback catalog with over 300 templates, ensuring offline functionality and graceful handling of GitHub API rate limits.
- **GitHub Authentication Flexibility**: Supports native 1-click VS Code GitHub authentication for 5,000 req/hr, as well as fallback to Personal Access Token (`cleanGitignore.githubToken`).
- **Smart OS Defaults**: Automatic pre-selection of `VisualStudioCode` and host OS (`macOS`, `Windows`, `Linux`) on new files (`cleanGitignore.autoSelectDefaults`).
- **Cross-Platform CRLF / LF Detection**: Intelligently preserves existing file line endings across Windows and Unix platforms.
- **Comprehensive Unit Test Suite**: 26 unit tests covering parsing, writing, path resolution, picker ordering, and fallback catalog integrity.
