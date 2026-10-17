import * as vscode from "vscode";
import * as os from "os";
import { GitignoreTemplate } from "../types";
import { CONFIG_AUTO_SELECT_DEFAULTS, CONFIG_SECTION } from "../constants";

export interface TemplateQuickPickItem extends vscode.QuickPickItem {
    template?: GitignoreTemplate;
}

export function getSystemOsTemplateName(): string | null {
    switch (os.platform()) {
        case "darwin":
            return "macOS";
        case "win32":
            return "Windows";
        case "linux":
            return "Linux";
        default:
            return null;
    }
}

/**
 * Returns user-friendly category description.
 */
export function getCategoryLabel(template: GitignoreTemplate): string {
    if (template.category === "global") {
        return "Global (OS / Tool / Editor)";
    }
    if (template.category === "community") {
        return template.subCategory 
            ? `Community (${template.subCategory})` 
            : "Community";
    }
    return "Language / Framework";
}

/**
 * Sorts and groups templates so that all selected templates appear at the top.
 */
export function sortAndGroupTemplates(
    allTemplates: GitignoreTemplate[],
    selectedNames: Set<string>
): (TemplateQuickPickItem | vscode.QuickPickItem)[] {
    const selectedItems: TemplateQuickPickItem[] = [];
    const availableItems: TemplateQuickPickItem[] = [];

    for (const template of allTemplates) {
        const isSelected = selectedNames.has(template.name.toLowerCase());
        const categoryLabel = getCategoryLabel(template);

        const item: TemplateQuickPickItem = {
            label: template.name,
            description: isSelected ? `(selected) • ${categoryLabel}` : categoryLabel,
            template,
        };

        if (isSelected) {
            selectedItems.push(item);
        } else {
            availableItems.push(item);
        }
    }

    // Sort selected items alphabetically
    selectedItems.sort((a, b) => a.label.localeCompare(b.label));

    // Sort available items: root first, then global, then community, then alphabetical
    const categoryRank = (cat?: string) => {
        if (cat === "root") return 1;
        if (cat === "global") return 2;
        return 3;
    };

    availableItems.sort((a, b) => {
        const rankDiff = categoryRank(a.template?.category) - categoryRank(b.template?.category);
        if (rankDiff !== 0) return rankDiff;
        return a.label.localeCompare(b.label);
    });

    const result: (TemplateQuickPickItem | vscode.QuickPickItem)[] = [];

    // Selected options ALWAYS at the top!
    if (selectedItems.length > 0) {
        result.push({
            label: `Selected (${selectedItems.length})`,
            kind: vscode.QuickPickItemKind.Separator,
        });
        result.push(...selectedItems);
    }

    result.push({
        label: "Available Templates",
        kind: vscode.QuickPickItemKind.Separator,
    });
    result.push(...availableItems);

    return result;
}

/**
 * Interactive template picker using VS Code QuickPick.
 * Selected options are dynamically kept at the top.
 */
export async function showTemplatePicker(
    allTemplates: GitignoreTemplate[],
    existingSectionNames: Set<string>,
    isFreshFile: boolean
): Promise<GitignoreTemplate[] | undefined> {
    const systemOs = getSystemOsTemplateName();

    // Initial selected set (case-insensitive)
    const initialSelectedNames = new Set<string>();
    for (const name of existingSectionNames) {
        initialSelectedNames.add(name.toLowerCase());
    }

    // Auto-recommend system OS & VS Code on fresh files if setting is enabled and no existing sections
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const autoSelect = config.get<boolean>(CONFIG_AUTO_SELECT_DEFAULTS, true);

    if (isFreshFile && initialSelectedNames.size === 0 && autoSelect) {
        initialSelectedNames.add("visualstudiocode");
        if (systemOs) {
            initialSelectedNames.add(systemOs.toLowerCase());
        }
    }

    return new Promise((resolve) => {
        const quickPick = vscode.window.createQuickPick<TemplateQuickPickItem>();
        quickPick.canSelectMany = true;
        quickPick.matchOnDescription = true;
        quickPick.title = "Clean GitIgnore: Select Templates";
        quickPick.placeholder = "Search templates (e.g. Unity, Node, macOS). Selected templates stay at the top.";

        const items = sortAndGroupTemplates(allTemplates, initialSelectedNames);
        quickPick.items = items as TemplateQuickPickItem[];

        // Pre-select initial items
        const initialSelected = items.filter(
            (item): item is TemplateQuickPickItem =>
                item.kind !== vscode.QuickPickItemKind.Separator &&
                "template" in item &&
                !!item.template &&
                initialSelectedNames.has(item.template.name.toLowerCase())
        );
        quickPick.selectedItems = initialSelected;

        if (initialSelected.length > 0) {
            quickPick.title = `Clean GitIgnore: Select Templates (${initialSelected.length} selected)`;
        }

        // Live update title with count when user toggles checkboxes without disrupting native QuickPick selection
        quickPick.onDidChangeSelection((selected) => {
            quickPick.title = selected.length > 0
                ? `Clean GitIgnore: Select Templates (${selected.length} selected)`
                : "Clean GitIgnore: Select Templates";
        });

        let accepted = false;

        quickPick.onDidAccept(() => {
            accepted = true;
            const finalTemplates: GitignoreTemplate[] = [];
            for (const item of quickPick.selectedItems) {
                if (item.template) {
                    finalTemplates.push(item.template);
                }
            }
            quickPick.hide();
            resolve(finalTemplates);
        });

        quickPick.onDidHide(() => {
            quickPick.dispose();
            if (!accepted) {
                resolve(undefined);
            }
        });

        quickPick.show();
    });
}
