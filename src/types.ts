import * as vscode from "vscode";

export type TemplateCategory = "root" | "global" | "community";

export interface GitignoreTemplate {
    name: string;        // e.g. "Unity", "macOS", "Laravel"
    path: string;        // e.g. "Unity.gitignore", "Global/macOS.gitignore", "community/PHP/Laravel.gitignore"
    category: TemplateCategory;
    subCategory?: string; // e.g. "PHP", "AWS"
}

export interface ParsedGitignore {
    customRules: string;
    sections: Map<string, string>; // templateName -> content
    sectionOrder: string[];         // template names in order of appearance
    eol: string;
    hasManagedBlock: boolean;
}

export interface TemplateQuickPickItem extends vscode.QuickPickItem {
    template: GitignoreTemplate;
}
