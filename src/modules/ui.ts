import * as vscode from "vscode";
import { QuickPickItem, window, workspace } from "vscode";
import { OVERRIDE_OPTIONS, PLACEHOLDERS } from "./config";

export function getFolderOption(folders: { name: string }[]): Promise<string | undefined> {
    const options = folders.map(folder => folder.name);

    return window.showQuickPick(options, {
        placeHolder: PLACEHOLDERS.location,
    }) as Promise<string | undefined>;
}

export function getOverrideOption(): Promise<boolean | undefined> {
    return window
        .showQuickPick(OVERRIDE_OPTIONS, {
            placeHolder: PLACEHOLDERS.override,
        })
        .then(option => {
            if (!option) {
                return undefined;
            }

            return option === OVERRIDE_OPTIONS[1];
        }) as Promise<boolean | undefined>;
}

export function getItemsOption(items: QuickPickItem[]): Promise<string[] | undefined> {
    return window
        .showQuickPick(items, {
            canPickMany: true,
            placeHolder: PLACEHOLDERS.selection_hint,
        })
        .then(selected => {
            if (!selected || selected.length === 0) {
                return undefined;
            }
            return selected.map(item => item.label);
        }) as Promise<string[] | undefined>;
}

export function openFile(filePath: string): void {
    vscode.commands.executeCommand("vscode.open", vscode.Uri.file(filePath));
}

export function openUntitledFile(content: string): void {
    workspace.openTextDocument({ content })
        .then((doc) => {
            return window.showTextDocument(doc);
        });
}
