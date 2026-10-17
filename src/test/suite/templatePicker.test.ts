import * as vscode from "vscode";
import * as assert from "assert";
import { sortAndGroupTemplates, TemplateQuickPickItem } from "../../ui/templatePicker";
import { GitignoreTemplate } from "../../types";

describe("Template Picker Dynamic Top Selection Tests", () => {
    const mockTemplates: GitignoreTemplate[] = [
        { name: "Node", path: "Node.gitignore", category: "root" },
        { name: "Python", path: "Python.gitignore", category: "root" },
        { name: "Unity", path: "Unity.gitignore", category: "root" },
        { name: "macOS", path: "Global/macOS.gitignore", category: "global" },
        { name: "Windows", path: "Global/Windows.gitignore", category: "global" },
        { name: "VisualStudioCode", path: "Global/VisualStudioCode.gitignore", category: "global" },
        { name: "Laravel", path: "community/PHP/Laravel.gitignore", category: "community", subCategory: "PHP" },
    ];

    it("should show selected options at the very top under a Selected separator", () => {
        const selectedNames = new Set(["unity", "macos"]);
        const items = sortAndGroupTemplates(mockTemplates, selectedNames);

        // First item MUST be the Selected separator
        assert.strictEqual(items[0].kind, vscode.QuickPickItemKind.Separator);
        assert.ok(items[0].label.includes("Selected (2)"));

        // Items immediately following MUST be the selected items
        const firstSelectedItem = items[1] as TemplateQuickPickItem;
        const secondSelectedItem = items[2] as TemplateQuickPickItem;

        assert.strictEqual(firstSelectedItem.label, "macOS");
        assert.strictEqual(secondSelectedItem.label, "Unity");

        // Next separator MUST be Available Templates
        assert.strictEqual(items[3].kind, vscode.QuickPickItemKind.Separator);
        assert.ok(items[3].label.includes("Available Templates"));

        // Rest of items are the available ones
        const availableLabels = items.slice(4).map((i) => i.label);
        assert.ok(!availableLabels.includes("macOS"));
        assert.ok(!availableLabels.includes("Unity"));
        assert.ok(availableLabels.includes("Node"));
        assert.ok(availableLabels.includes("Python"));
    });

    it("should not show Selected separator if nothing is selected", () => {
        const selectedNames = new Set<string>();
        const items = sortAndGroupTemplates(mockTemplates, selectedNames);

        // First item should be the Available Templates separator
        assert.strictEqual(items[0].kind, vscode.QuickPickItemKind.Separator);
        assert.ok(items[0].label.includes("Available Templates"));

        // All mockTemplates should be present in available
        assert.strictEqual(items.length, mockTemplates.length + 1);
    });

    it("should match selected items case-insensitively", () => {
        const selectedNames = new Set(["visualstudiocode", "python"]);
        const items = sortAndGroupTemplates(mockTemplates, selectedNames);

        assert.ok(items[0].label.includes("Selected (2)"));
        const selectedLabels = [items[1].label, items[2].label];
        assert.ok(selectedLabels.includes("Python"));
        assert.ok(selectedLabels.includes("VisualStudioCode"));
    });

    it("should move newly selected option to the top when selection changes", () => {
        // Initial selection: Node
        let selectedNames = new Set(["node"]);
        let items = sortAndGroupTemplates(mockTemplates, selectedNames);
        assert.ok(items[0].label.includes("Selected (1)"));
        assert.strictEqual(items[1].label, "Node");

        // User selects Laravel as well
        selectedNames = new Set(["node", "laravel"]);
        items = sortAndGroupTemplates(mockTemplates, selectedNames);
        assert.ok(items[0].label.includes("Selected (2)"));
        const selectedLabels = [items[1].label, items[2].label];
        assert.deepStrictEqual(selectedLabels.sort(), ["Laravel", "Node"]);
    });

    it("should move deselected option back to Available Templates", () => {
        // Start with Node and Unity selected
        let selectedNames = new Set(["node", "unity"]);
        let items = sortAndGroupTemplates(mockTemplates, selectedNames);
        assert.ok(items[0].label.includes("Selected (2)"));

        // User deselects Unity
        selectedNames = new Set(["node"]);
        items = sortAndGroupTemplates(mockTemplates, selectedNames);
        assert.ok(items[0].label.includes("Selected (1)"));
        assert.strictEqual(items[1].label, "Node");

        // Unity is now in Available Templates
        const availableLabels = items.slice(3).map((i) => i.label);
        assert.ok(availableLabels.includes("Unity"));
    });

    it("should order available templates: root first, global second, community third", () => {
        const selectedNames = new Set<string>();
        const items = sortAndGroupTemplates(mockTemplates, selectedNames);
        const availableItems = items.slice(1) as TemplateQuickPickItem[];

        const categories = availableItems.map((i) => i.template?.category);
        const rootIndex = categories.indexOf("root");
        const globalIndex = categories.indexOf("global");
        const communityIndex = categories.indexOf("community");

        assert.ok(rootIndex < globalIndex, "Root templates should precede global templates");
        assert.ok(globalIndex < communityIndex, "Global templates should precede community templates");
    });
});
