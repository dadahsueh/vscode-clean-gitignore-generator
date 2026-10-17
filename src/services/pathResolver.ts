import * as path from "path";
import * as fs from "fs";
import { FILE_NAME } from "../constants";

export interface TargetResolution {
    targetPath: string | null;
    isUntitled: boolean;
}

export interface WorkspaceFolderLike {
    uri: { fsPath: string };
    name?: string;
}

export interface UriLike {
    fsPath: string;
    scheme?: string;
}

/**
 * Checks if a given filesystem path is a directory.
 */
export function checkIsDirectory(fsPath: string): boolean {
    try {
        const stat = fs.statSync(fsPath);
        return stat.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Resolves the destination .gitignore path based on how the command was triggered:
 * 1. Right-clicking a folder -> .gitignore inside the folder
 * 2. Right-clicking a file -> .gitignore in the same folder as the file
 * 3. Right-clicking in empty space or Command Palette -> .gitignore at workspace root
 * 4. No workspace open -> returns isUntitled: true (user will manually save)
 */
export async function resolveTargetLocation(
    uri?: UriLike,
    workspaceFolders?: readonly WorkspaceFolderLike[],
    isDirectoryFn: (fsPath: string) => boolean = checkIsDirectory,
    pickFolderFn?: () => Promise<WorkspaceFolderLike | undefined>
): Promise<TargetResolution> {
    // 1. Right-click context menu with a resource URI (file or directory)
    if (uri && uri.fsPath) {
        if (isDirectoryFn(uri.fsPath)) {
            // Right-clicking a folder: generate inside that folder
            return {
                targetPath: path.join(uri.fsPath, FILE_NAME),
                isUntitled: false,
            };
        } else {
            // Right-clicking a file: generate in the same folder as the file
            return {
                targetPath: path.join(path.dirname(uri.fsPath), FILE_NAME),
                isUntitled: false,
            };
        }
    }

    // 2. Right-clicking in empty space or Command Palette (no resource URI provided)
    if (!workspaceFolders || workspaceFolders.length === 0) {
        // No workspace is open -> open untitled document for user to manually save
        return {
            targetPath: null,
            isUntitled: true,
        };
    }

    if (workspaceFolders.length === 1) {
        // Single root workspace: generate at root
        return {
            targetPath: path.join(workspaceFolders[0].uri.fsPath, FILE_NAME),
            isUntitled: false,
        };
    }

    // Multi-root workspace: prompt user to pick folder
    if (pickFolderFn) {
        const picked = await pickFolderFn();
        if (!picked) {
            return { targetPath: null, isUntitled: false }; // User cancelled
        }
        return {
            targetPath: path.join(picked.uri.fsPath, FILE_NAME),
            isUntitled: false,
        };
    }

    // Default to first workspace root if no picker provided
    return {
        targetPath: path.join(workspaceFolders[0].uri.fsPath, FILE_NAME),
        isUntitled: false,
    };
}
