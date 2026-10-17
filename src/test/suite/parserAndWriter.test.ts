import * as assert from "assert";
import { parseGitignoreContent, detectEol } from "../../services/gitignoreParser";
import { buildGitignoreContent } from "../../services/gitignoreWriter";
import {
    MANAGED_START_MARKER,
    MANAGED_END_MARKER
} from "../../constants";

describe("Gitignore Parser & Writer Tests", () => {
    describe("detectEol", () => {
        it("should detect CRLF line endings", () => {
            const content = "line1\r\nline2\r\nline3\r\n";
            assert.strictEqual(detectEol(content), "\r\n");
        });

        it("should detect LF line endings", () => {
            const content = "line1\nline2\nline3\n";
            assert.strictEqual(detectEol(content), "\n");
        });
    });

    describe("parseGitignoreContent", () => {
        it("should treat unmanaged files as entirely custom rules", () => {
            const raw = "# My existing gitignore\nbuild/\n*.log\n";
            const parsed = parseGitignoreContent(raw);

            assert.strictEqual(parsed.hasManagedBlock, false);
            assert.strictEqual(parsed.customRules, raw.trim());
            assert.strictEqual(parsed.sections.size, 0);
        });

        it("should extract custom section at top and template sections from managed file", () => {
            const raw = [
                "# My personal rules",
                "secret.env",
                "",
                MANAGED_START_MARKER,
                "",
                "### Unity ###",
                "/Library/",
                "/Temp/",
                "",
                "### macOS ###",
                ".DS_Store",
                "",
                MANAGED_END_MARKER,
            ].join("\n");

            const parsed = parseGitignoreContent(raw);

            assert.strictEqual(parsed.hasManagedBlock, true);
            assert.strictEqual(parsed.customRules, "# My personal rules\nsecret.env");
            assert.strictEqual(parsed.sections.size, 2);
            assert.strictEqual(parsed.sections.get("Unity"), "/Library/\n/Temp/");
            assert.strictEqual(parsed.sections.get("macOS"), ".DS_Store");
            assert.deepStrictEqual(parsed.sectionOrder, ["Unity", "macOS"]);
        });

        it("should parse legacy clean-gitignore-generator boundary markers", () => {
            const raw = [
                "# Legacy rules",
                "",
                "# ===== clean-gitignore-generator: DO NOT EDIT BELOW THIS LINE =====",
                "### Python ###",
                "__pycache__/",
                "# ===== clean-gitignore-generator: END =====",
            ].join("\n");

            const parsed = parseGitignoreContent(raw);
            assert.strictEqual(parsed.hasManagedBlock, true);
            assert.strictEqual(parsed.customRules, "# Legacy rules");
            assert.strictEqual(parsed.sections.get("Python"), "__pycache__/");
        });
    });

    describe("buildGitignoreContent", () => {
        it("should place custom rules at top and include section markers", () => {
            const customRules = "# Custom rules\n*.local";
            const sections = new Map<string, string>();
            sections.set("Node", "node_modules/\nnpm-debug.log");
            sections.set("macOS", ".DS_Store");

            const output = buildGitignoreContent({
                customRules,
                sections,
                sectionOrder: ["Node", "macOS"],
                eol: "\n",
            });

            // Custom at top
            assert.ok(output.startsWith("# Custom rules\n*.local"));

            // Managed markers present
            assert.ok(output.includes(MANAGED_START_MARKER));
            assert.ok(output.includes("### Node ###"));
            assert.ok(output.includes("node_modules/"));
            assert.ok(output.includes("### macOS ###"));
            assert.ok(output.includes(".DS_Store"));
            assert.ok(output.includes(MANAGED_END_MARKER));
        });

        it("should cleanly remove sections that were deselected", () => {
            const customRules = "# Custom rules";
            // Node was kept, macOS was removed (not in map)
            const sections = new Map<string, string>();
            sections.set("Node", "node_modules/");

            const output = buildGitignoreContent({
                customRules,
                sections,
                sectionOrder: ["Node"],
                eol: "\n",
            });

            assert.ok(output.includes("### Node ###"));
            assert.ok(!output.includes("### macOS ###"));
        });

        it("should start directly with managed boundary when custom rules are empty", () => {
            const sections = new Map<string, string>();
            sections.set("Python", "__pycache__/");

            const output = buildGitignoreContent({
                customRules: "",
                sections,
                sectionOrder: ["Python"],
                eol: "\n",
            });

            // Clean start directly with managed marker, no injected boilerplate comments
            assert.ok(output.startsWith(MANAGED_START_MARKER));
            assert.ok(output.includes("### Python ###"));
            assert.ok(output.includes(MANAGED_END_MARKER));
        });
    });
});
