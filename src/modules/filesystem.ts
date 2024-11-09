import { existsSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { WorkspaceFolder } from "vscode";

export function readFile(filePath: string): string | null {
    try {
        const normalizedPath = path.normalize(filePath);
        return readFileSync(normalizedPath, { encoding: "utf-8" });
    } catch (e: unknown) {
        console.error(`Error reading file at ${filePath}:`, e);
        return null;
    }
}

export function writeFile(filePath: string, content: string): boolean {
    try {
        const normalizedPath = path.normalize(filePath);
        writeFileSync(normalizedPath, content);
        return true;
    } catch (e: unknown) {
        console.error(`Error writing to file at ${filePath}:`, e);
        return false;
    }
}

export function fileExists(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    return existsSync(normalizedPath);
}

export function hasFolder(folders: readonly WorkspaceFolder[]): boolean {
    return folders.length > 0;
}
