import * as vscode from "vscode";
import { Uri } from "vscode";
import Generator from "./Generator";

export function activate(context: vscode.ExtensionContext) {
	const generateGitignoreCommand = vscode.commands.registerCommand(
		"extension.generateGitignore",
		async (uri: Uri) => {
			const generator = new Generator();
			await generator.init(uri);
		}
	);

	context.subscriptions.push(generateGitignoreCommand);
}
