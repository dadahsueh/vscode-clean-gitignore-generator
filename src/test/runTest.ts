// Minimal vscode mock for running fast Node-based unit tests
const Module = require("module");
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id: string, ...args: any[]) {
    if (id === "vscode") {
        return {
            QuickPickItemKind: {
                Separator: -1,
                Default: 0,
            },
            FileType: {
                Unknown: 0,
                File: 1,
                Directory: 2,
                SymbolicLink: 64,
            },
            Uri: {
                file: (p: string) => ({ fsPath: p, scheme: "file" }),
                parse: (s: string) => ({ fsPath: s, scheme: "untitled" }),
            },
            window: {},
            authentication: {
                getSession: async () => null,
            },
            workspace: {
                getConfiguration: () => ({
                    get: (_key: string, defaultValue: any) => defaultValue,
                }),
            },
        };
    }
    return originalRequire.apply(this, [id, ...args]);
};

import { run } from "./suite/index";

async function main() {
    try {
        await run();
        console.log("All unit tests passed successfully!");
    } catch (err) {
        console.error("Test execution failed:", err);
        process.exit(1);
    }
}

main();
