<div align="center">
  <img src="images/icon-256.png" width="128" height="128" alt="Clean GitIgnore Generator Logo" />
  <h1>Clean GitIgnore Generator</h1>
  <p>A fast, clean, and reliable VS Code extension to generate and manage <code>.gitignore</code> files directly from GitHub's official templates repository.</p>
</div>

---

## 🚀 Features

- **Official GitHub Templates** — Pulls directly from [github/gitignore](https://github.com/github/gitignore) (over 300+ templates across Language, Global/OS/Editor, and Community categories). No third-party unstable APIs.
- **Section-Based Management** — Each template is wrapped in its own clear section header (e.g. `### Unity ###`, `### macOS ###`).
- **Interactive Section Toggling** — Re-running the generator on an existing `.gitignore` pre-checks existing sections. Uncheck to remove a template, check to add new ones.
- **Top Custom Rules Preservation** — Your custom rules always live at the **top** of the file and are **never** modified or overwritten.
- **Safe Boundary Markers** — Unique outer boundary markers ensure Clean GitIgnore Generator never conflicts with existing comments or other tools.
- **Built-in Caching** — Templates and tree indexes are cached locally with configurable refresh intervals for snappy offline & online performance.
- **Cross-Platform & Line Ending Aware** — Properly parses and respects both CRLF (`\r\n`) and LF (`\n`).

---

## 📖 How It Works

### File Structure

Generated `.gitignore` files look like this:

```gitignore
# Any custom rules you add outside our section are completely preserved!
.env.local
my-scratch/
*.secret

# ===== vscode-clean-gitignore-generator: DO NOT EDIT BELOW THIS LINE =====

### Unity ###
/[Ll]ibrary/
/[Tt]emp/
/[Oo]bj/
/[Bb]uild/
/[Bb]uilds/
/[Ll]ogs/
/[Uu]ser[Ss]ettings/
*.log

### macOS ###
# General
.DS_Store
.AppleDouble
.LSOverride

# ===== vscode-clean-gitignore-generator: END =====
```

> [!NOTE]
> Anything outside our boundary markers is completely preserved and never touched by Clean GitIgnore Generator.

---

## 🕹️ Usage

### 1. Command Palette
1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Type `Generate .gitignore` and press Enter.
3. Select the desired templates from the searchable multi-select picker.
4. Press Enter to generate.

If no folder is open in VS Code, the extension opens a new untitled document with the generated content.

### 2. Explorer Context Menu
1. Right-click any **folder** in the VS Code file explorer and click `Generate .gitignore` to create or update `.gitignore` in that folder.
2. Right-click any **file** and click `Generate .gitignore` to create or update `.gitignore` in that file's parent directory.

### 3. Updating & Removing Sections
Whenever you run `Generate .gitignore` on an existing file:
- Templates already present in your file will be **pre-checked** and marked `(already in .gitignore)`.
- **Uncheck** any template to remove its section.
- **Check** new templates to add them.
- Your custom rules at the top are untouched!

---

## ⚙️ Configuration

| Setting | Default | Description |
| :--- | :--- | :--- |
| `cleanGitignore.autoSelectDefaults` | `true` | Automatically pre-select VisualStudioCode and the current operating system template on fresh `.gitignore` files. |
| `cleanGitignore.cacheTTLHours` | `24` | How many hours to cache the template catalog before refreshing from GitHub. |
| `cleanGitignore.githubToken` | `null` | Optional GitHub Personal Access Token for increased API rate limits (fallback if VS Code authentication is not used). |

> [!TIP]
> **Authentication Flexibility:**  
> The extension works out of the box with zero setup. You can either sign in with 1 click using VS Code's built-in GitHub accounts or supply a custom Personal Access Token via `cleanGitignore.githubToken`.

---

## 🛠️ Commands

- `Clean GitIgnore: Generate .gitignore` (`cleanGitignore.generate`): Generates or updates `.gitignore`.
- `Clean GitIgnore: Refresh Template Cache` (`cleanGitignore.refreshCache`): Forces an immediate refresh of the template cache.
- `Clean GitIgnore: Sign in with GitHub` (`cleanGitignore.signIn`): Signs in using VS Code's native GitHub account for elevated API rate limits.

---

## 📄 License

[MIT](LICENSE) © dadahsueh
