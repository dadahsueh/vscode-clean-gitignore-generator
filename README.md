<div align="center">
  <img src="images/icon-256.png" width="128" height="128" alt="Clean GitIgnore Generator Logo" />
  <h1>Clean GitIgnore Generator</h1>
  <p><strong>A fast, clean, and reliable VS Code extension to generate and manage <code>.gitignore</code> files directly from GitHub's official repository with section toggling and custom rules preservation.</strong></p>

  <p>
    <a href="https://github.com/dadahsueh/vscode-clean-gitignore-generator/releases"><img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square" alt="Version" /></a>
    <a href="https://github.com/dadahsueh/vscode-clean-gitignore-generator/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="License" /></a>
    <a href="https://code.visualstudio.com/"><img src="https://img.shields.io/badge/VS%20Code-%5E1.85.0-007ACC.svg?style=flat-square&logo=visual-studio-code" alt="VS Code Version" /></a>
    <img src="https://img.shields.io/badge/tests-26%20passed-brightgreen.svg?style=flat-square" alt="Tests Status" />
  </p>
</div>

---

## ⚡ Highlights

- 🎯 **Official GitHub Templates** — Pulls directly from [github/gitignore](https://github.com/github/gitignore) containing **300+ verified templates** across Language, Global/OS/Editor, and Community categories.
- 🔄 **Interactive Section Toggling** — Re-running the generator on an existing `.gitignore` pre-checks existing templates. Uncheck to remove a template cleanly, check to add new ones.
- 📌 **Dynamic Top-Pinned Selection** — Selected templates automatically stay pinned at the top of the picker list for effortless review and editing.
- 🛡️ **Zero Data Loss (Custom Rules Preserved)** — Any custom rules, notes, or environment files you define outside the managed section are **never overwritten or removed**.
- 📴 **Offline & Rate-Limit Resilient** — Bundled with an offline fallback catalog of 300+ templates and automatic 2-tier caching (memory + persistent `globalState`).
- 🔑 **Flexible Authentication** — Works out-of-the-box with zero setup, with optional 1-click VS Code GitHub sign-in or custom Personal Access Token for high rate limits (5,000 req/hr).
- 📂 **Context-Aware Path Resolution** — Right-click any file, folder, or empty workspace canvas to generate the `.gitignore` in the exact directory you want.
- 🪟 **Cross-Platform & CRLF / LF Aware** — Automatically detects and respects Windows (`\r\n`) and Unix (`\n`) line endings.

---

## 📖 How It Works

Clean GitIgnore Generator wraps managed templates inside explicit boundary markers. Your unique personal and project rules always stay cleanly at the top of the file:

```gitignore
# ==============================================================================
# CUSTOM PROJECT RULES
# Any rules placed outside the managed section are 100% preserved!
# ==============================================================================
.env.local
.env.*.local
my-scratch/
*.secret
credentials.json

# ===== vscode-clean-gitignore-generator: DO NOT EDIT BELOW THIS LINE =====

### Node ###
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

### macOS ###
# General
.DS_Store
.AppleDouble
.LSOverride

### VisualStudioCode ###
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# ===== vscode-clean-gitignore-generator: END =====
```

> [!NOTE]
> Anything outside `# ===== vscode-clean-gitignore-generator: DO NOT EDIT BELOW THIS LINE =====` and `# ===== vscode-clean-gitignore-generator: END =====` is completely preserved. Even accidental text appended below the closing marker is safely migrated back to your custom rules upon generation.

---

## 🕹️ Usage

### 1. Command Palette
1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Type **`Clean GitIgnore: Generate .gitignore`** and press Enter.
3. Select your desired templates from the searchable multi-select picker.
4. Press Enter to generate or update your `.gitignore`.

*If no folder is open in VS Code, the extension automatically opens a new untitled document with the generated content ready for you to save.*

### 2. Explorer Context Menu
- **Right-click a folder** → Select **`Generate .gitignore`** to generate directly inside that folder.
- **Right-click a file** → Select **`Generate .gitignore`** to generate inside the parent directory containing that file.
- **Multi-Root Workspaces** → Prompts you to pick which workspace folder to target.

### 3. Modifying Existing Files
When running on an existing `.gitignore`:
- All currently active templates are **pre-checked** and pinned to the **Selected** group at the top.
- **Uncheck** any template to remove its section.
- **Check** new templates to add them.
- All existing custom rules at the top remain completely untouched.

---

## ⚙️ Configuration

Custom settings can be configured via VS Code Settings (`Cmd+,` or `Ctrl+,`, then search for `Clean GitIgnore`):

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `cleanGitignore.autoSelectDefaults` | `boolean` | `true` | Automatically pre-selects `VisualStudioCode` and the current OS template (`macOS`, `Windows`, or `Linux`) on fresh files. |
| `cleanGitignore.cacheTTLHours` | `number` | `24` | How many hours to cache the template catalog before refreshing from GitHub. |
| `cleanGitignore.githubToken` | `string \| null` | `null` | Optional GitHub Personal Access Token (fallback if native VS Code authentication is not used). |

---

## 🔑 Authentication & Rate Limits

Clean GitIgnore Generator requires **no setup or API key** for typical use.

- **Unauthenticated GitHub API**: 60 requests / hour per IP address.
- **VS Code GitHub Sign-In**: 5,000 requests / hour.
  - Run **`Clean GitIgnore: Sign in with GitHub`** from the Command Palette, or click the sign-in prompt when notified.
- **Personal Access Token**: You can also supply a token in `cleanGitignore.githubToken` (no special scopes needed, public access is sufficient).
- **Offline Fallback**: If you are offline or hit GitHub's rate limit, Clean GitIgnore Generator automatically falls back to its bundled catalog of 300+ templates.

---

## 🛠️ Commands

| Command | Identifier | Description |
| :--- | :--- | :--- |
| **Clean GitIgnore: Generate .gitignore** | `cleanGitignore.generate` | Generates or updates `.gitignore` in the target folder or workspace. |
| **Clean GitIgnore: Refresh Template Cache** | `cleanGitignore.refreshCache` | Clears local memory and persistent cache to fetch fresh templates from GitHub. |
| **Clean GitIgnore: Sign in with GitHub** | `cleanGitignore.signIn` | Connects your GitHub account via VS Code authentication for elevated API limits. |

---

## 📦 Installation

### From VS Code VSIX Package
Download the latest `.vsix` release from the repository and install it via:

```bash
code --install-extension clean-gitignore-generator-1.0.0.vsix
```

Alternatively, open VS Code, go to the **Extensions view** (`Ctrl+Shift+X` / `Cmd+Shift+X`), click the **`...`** (Views and More Actions) menu at the top-right, and select **Install from VSIX...**.

---

## 💻 Development & Testing

### Prerequisites
- Node.js (`v18` or higher recommended)
- npm (`v9` or higher)

### Setup & Build
```bash
# Install dependencies
npm install

# Type-check and build with esbuild
npm run compile

# Run the test suite (Mocha + VS Code Test Runner)
npm test

# Package into production VSIX
npm run package
```

---

## 📄 License

This extension is licensed under the [MIT License](LICENSE) © dadahsueh.
Templates are provided courtesy of [github/gitignore](https://github.com/github/gitignore).
