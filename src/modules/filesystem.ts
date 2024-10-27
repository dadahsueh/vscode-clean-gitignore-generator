import { existsSync, readFileSync, writeFileSync } from "fs";
import { WorkspaceFolder } from "vscode";

export function readFile(path: string): string | null {
    try {
        return readFileSync(path, { encoding: "utf-8" });
    } catch (e: unknown) {
        console.error(`Error reading file at ${path}:`, e);
        return null;
    }
}

export function writeFile(path: string, content: string): boolean {
    try {
        writeFileSync(path, content);
        return true;
    } catch (e: unknown) {
        console.error(`Error writing to file at ${path}:`, e);
        return false;
    }
}

export function fileExists(path: string): boolean {
    return existsSync(path);
}

export function hasFolder(folders: readonly WorkspaceFolder[]): boolean {
    return folders?.length > 0;
}
