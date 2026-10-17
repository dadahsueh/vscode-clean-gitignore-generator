import * as assert from "assert";
import * as path from "path";
import { resolveTargetLocation } from "../../services/pathResolver";
import { FILE_NAME } from "../../constants";

describe("Target Path Resolver Tests", () => {
    describe("Right-clicking a file", () => {
        it("should generate in the same folder of the file", async () => {
            const filePath = path.join("/projects", "my-app", "src", "index.ts");
            const result = await resolveTargetLocation(
                { fsPath: filePath },
                [{ uri: { fsPath: path.join("/projects", "my-app") } }],
                () => false // isDirectory = false (it's a file)
            );

            assert.strictEqual(result.isUntitled, false);
            assert.strictEqual(
                result.targetPath,
                path.join("/projects", "my-app", "src", FILE_NAME)
            );
        });

        it("should generate in the same folder for deeply nested files", async () => {
            const filePath = path.join("/projects", "my-app", "src", "components", "ui", "Button.tsx");
            const result = await resolveTargetLocation(
                { fsPath: filePath },
                [{ uri: { fsPath: path.join("/projects", "my-app") } }],
                () => false
            );

            assert.strictEqual(result.isUntitled, false);
            assert.strictEqual(
                result.targetPath,
                path.join("/projects", "my-app", "src", "components", "ui", FILE_NAME)
            );
        });

        it("should generate in the same folder when right-clicking an existing .gitignore", async () => {
            const filePath = path.join("/projects", "my-app", "nested", ".gitignore");
            const result = await resolveTargetLocation(
                { fsPath: filePath },
                [{ uri: { fsPath: path.join("/projects", "my-app") } }],
                () => false
            );

            assert.strictEqual(result.isUntitled, false);
            assert.strictEqual(
                result.targetPath,
                path.join("/projects", "my-app", "nested", FILE_NAME)
            );
        });
    });

    describe("Right-clicking a folder", () => {
        it("should generate directly inside the selected folder", async () => {
            const folderPath = path.join("/projects", "my-app", "packages", "core");
            const result = await resolveTargetLocation(
                { fsPath: folderPath },
                [{ uri: { fsPath: path.join("/projects", "my-app") } }],
                () => true // isDirectory = true
            );

            assert.strictEqual(result.isUntitled, false);
            assert.strictEqual(
                result.targetPath,
                path.join("/projects", "my-app", "packages", "core", FILE_NAME)
            );
        });
    });

    describe("Right-clicking in empty space / Command Palette", () => {
        it("should generate at workspace root when single workspace folder is open", async () => {
            const workspaceRoot = path.join("/projects", "my-app");
            // In empty space, uri is undefined
            const result = await resolveTargetLocation(
                undefined,
                [{ uri: { fsPath: workspaceRoot } }]
            );

            assert.strictEqual(result.isUntitled, false);
            assert.strictEqual(result.targetPath, path.join(workspaceRoot, FILE_NAME));
        });

        it("should prompt user and generate in selected folder for multi-root workspaces", async () => {
            const rootA = path.join("/projects", "frontend");
            const rootB = path.join("/projects", "backend");

            const result = await resolveTargetLocation(
                undefined,
                [{ uri: { fsPath: rootA } }, { uri: { fsPath: rootB } }],
                () => true,
                async () => ({ uri: { fsPath: rootB }, name: "backend" }) // User picks backend
            );

            assert.strictEqual(result.isUntitled, false);
            assert.strictEqual(result.targetPath, path.join(rootB, FILE_NAME));
        });

        it("should cancel gracefully if user cancels multi-root workspace pick", async () => {
            const rootA = path.join("/projects", "frontend");
            const rootB = path.join("/projects", "backend");

            const result = await resolveTargetLocation(
                undefined,
                [{ uri: { fsPath: rootA } }, { uri: { fsPath: rootB } }],
                () => true,
                async () => undefined // User pressed ESC
            );

            assert.strictEqual(result.isUntitled, false);
            assert.strictEqual(result.targetPath, null);
        });
    });

    describe("No workspace is open", () => {
        it("should return isUntitled: true when workspaceFolders is undefined", async () => {
            const result = await resolveTargetLocation(undefined, undefined);

            assert.strictEqual(result.isUntitled, true);
            assert.strictEqual(result.targetPath, null);
        });

        it("should return isUntitled: true when workspaceFolders is an empty array", async () => {
            const result = await resolveTargetLocation(undefined, []);

            assert.strictEqual(result.isUntitled, true);
            assert.strictEqual(result.targetPath, null);
        });
    });
});
