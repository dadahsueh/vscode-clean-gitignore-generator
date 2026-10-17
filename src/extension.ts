import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { CacheManager } from "./services/cacheManager";
import { TemplateService } from "./services/templateService";
import { parseGitignoreFile } from "./services/gitignoreParser";
import { buildGitignoreContent } from "./services/gitignoreWriter";
import { resolveTargetLocation } from "./services/pathResolver";
import { showTemplatePicker } from "./ui/templatePicker";

export function activate(context: vscode.ExtensionContext) {
    const cacheManager = new CacheManager(context);
    const templateService = new TemplateService(cacheManager);

    const generateCommand = vscode.commands.registerCommand(
        "cleanGitignore.generate",
        async (uri?: vscode.Uri) => {
            try {
                // 1. Resolve target location (file folder, folder, root on empty space, or untitled if no workspace)
                const { targetPath, isUntitled } = await resolveTargetLocation(
                    uri,
                    vscode.workspace.workspaceFolders,
                    undefined,
                    async () => await vscode.window.showWorkspaceFolderPick({
                        placeHolder: "Select workspace folder for .gitignore file",
                    })
                );

                if (targetPath === null && !isUntitled) {
                    return; // User cancelled workspace folder pick
                }

                // 2. Parse existing .gitignore if present
                const fileExists = targetPath ? fs.existsSync(targetPath) : false;
                const parsed = targetPath ? parseGitignoreFile(targetPath) : {
                    customRules: "",
                    sections: new Map<string, string>(),
                    sectionOrder: [] as string[],
                    eol: process.platform === "win32" ? "\r\n" : "\n",
                    hasManagedBlock: false,
                };

                const existingSectionNames = new Set(parsed.sections.keys());
                const isFreshFile = !fileExists || (!parsed.hasManagedBlock && existingSectionNames.size === 0);

                // 3. Load templates from GitHub (with progress indicator)
                const templates = await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: "Fetching .gitignore templates from GitHub...",
                        cancellable: false,
                    },
                    async () => {
                        return await templateService.getTemplates();
                    }
                );

                // 4. Show template picker (selected options are grouped dynamically at the top)
                const selectedTemplates = await showTemplatePicker(
                    templates,
                    existingSectionNames,
                    isFreshFile
                );

                if (!selectedTemplates) {
                    return; // User cancelled picker
                }

                if (selectedTemplates.length === 0 && fileExists && existingSectionNames.size > 0) {
                    const confirm = await vscode.window.showWarningMessage(
                        "No templates selected. Do you want to remove all managed template sections?",
                        "Remove All",
                        "Cancel"
                    );
                    if (confirm !== "Remove All") {
                        return;
                    }
                } else if (selectedTemplates.length === 0) {
                    vscode.window.showWarningMessage("No templates selected. Operation cancelled.");
                    return;
                }

                // 5. Download content for newly selected templates
                const updatedSections = new Map<string, string>();
                const newOrder: string[] = [];

                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: "Generating .gitignore content...",
                        cancellable: false,
                    },
                    async (progress) => {
                        // Maintain order: existing preserved first, new templates appended
                        const selectedNames = new Set(selectedTemplates.map(t => t.name));

                        // 1. Existing sections that are still selected
                        for (const name of parsed.sectionOrder) {
                            if (selectedNames.has(name)) {
                                newOrder.push(name);
                            }
                        }

                        // 2. Newly added sections in user selection order
                        for (const template of selectedTemplates) {
                            if (!newOrder.includes(template.name)) {
                                newOrder.push(template.name);
                            }
                        }

                        // Fetch contents
                        const total = selectedTemplates.length;
                        let count = 0;

                        for (const template of selectedTemplates) {
                            count++;
                            progress.report({
                                message: `${template.name} (${count}/${total})`,
                                increment: 100 / (total || 1),
                            });

                            // If we already had the section content, reuse it
                            const existingContent = parsed.sections.get(template.name);
                            if (existingContent && existingContent.length > 0) {
                                updatedSections.set(template.name, existingContent);
                            } else {
                                const content = await templateService.getTemplateContent(template);
                                updatedSections.set(template.name, content);
                            }
                        }
                    }
                );

                // 6. Build final content
                const outputContent = buildGitignoreContent({
                    customRules: parsed.customRules,
                    sections: updatedSections,
                    sectionOrder: newOrder,
                    eol: parsed.eol,
                });

                // 7. Write to file or open untitled document for user to manually save
                if (targetPath) {
                    fs.writeFileSync(targetPath, outputContent, "utf-8");
                    const doc = await vscode.workspace.openTextDocument(targetPath);
                    await vscode.window.showTextDocument(doc);

                    const actionVerb = fileExists ? "updated" : "generated";
                    vscode.window.showInformationMessage(`Successfully ${actionVerb} .gitignore at ${path.basename(path.dirname(targetPath))}`);
                } else {
                    // No workspace open -> open untitled .gitignore for user to manually save
                    try {
                        const untitledUri = vscode.Uri.parse("untitled:.gitignore");
                        const doc = await vscode.workspace.openTextDocument(untitledUri);
                        const editor = await vscode.window.showTextDocument(doc);
                        await editor.edit((editBuilder) => {
                            editBuilder.insert(new vscode.Position(0, 0), outputContent);
                        });
                    } catch {
                        const doc = await vscode.workspace.openTextDocument({
                            content: outputContent,
                            language: "ignore",
                        });
                        await vscode.window.showTextDocument(doc);
                    }
                    vscode.window.showInformationMessage("Generated .gitignore in a new untitled document. You can now save it to your desired location.");
                }
            } catch (err: any) {
                vscode.window.showErrorMessage(`Error generating .gitignore: ${err.message || err}`);
            }
        }
    );

    const refreshCacheCommand = vscode.commands.registerCommand(
        "cleanGitignore.refreshCache",
        async () => {
            try {
                await templateService.refreshCache();
                vscode.window.showInformationMessage("Clean GitIgnore: Template cache refreshed successfully.");
            } catch (err: any) {
                vscode.window.showErrorMessage(`Failed to refresh cache: ${err.message || err}`);
            }
        }
    );

    const signInCommand = vscode.commands.registerCommand(
        "cleanGitignore.signIn",
        async () => {
            await templateService.promptSignIn();
        }
    );

    context.subscriptions.push(generateCommand, refreshCacheCommand, signInCommand);
}

export function deactivate() {}
