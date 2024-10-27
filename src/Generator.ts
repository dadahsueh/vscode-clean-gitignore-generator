import * as path from "path";
import { FileType, Uri, window, workspace } from "vscode";
import { API_URL, ALTERNATIVE_API_URL, FILE_NAME, MESSAGES } from "./modules/config";
import {
    getItemsOption,
    getOverrideOption,
    openFile,
    openUntitledFile,
} from "./modules/ui";
import { fileExists, writeFile } from "./modules/filesystem";
import { getData } from "./modules/http";
import { generateFile, getList, hitAntiDdos } from "./modules/helpers";

export default class Generator {
    private filePath: string | null = null;
    private override: boolean = true;
    private selected: string[] = [];
    private eol: string = "\n";
    private isWorkspaceRoot: boolean = false;

    public async init(uri: Uri | null): Promise<void> {
        const workspaceUri = workspace.workspaceFolders && workspace.workspaceFolders[0].uri;
        const currentUri = uri || workspaceUri;

        if (currentUri) {
            this.filePath = await this.getFilePath(currentUri);
            const folderUri = currentUri.with({ path: path.dirname(currentUri.path) });
            const folderPath = folderUri.fsPath;
            this.isWorkspaceRoot = workspaceUri?.fsPath === folderPath;
        }

        if (this.filePath) {
            this.override = await this.getOverrideOption();
        }

        this.eol = this.getEolPreference();

        this.selected = await this.getSelectedOptions() || [];
        await this.generate();
    }

    private getEolPreference(): string {
        const eolSetting = workspace.getConfiguration("files").get<string>("eol", "\n");
        return eolSetting === "auto" ? (process.platform === "win32" ? "\r\n" : "\n") : eolSetting;
    }

    private async get(fn: Function, ...args: any[]): Promise<any> {
        const result = await fn.apply(this, args);

        if (result === undefined) {
            this.abort();
        }

        return result;
    }

    private async getFilePath(uri: Uri): Promise<string | null> {
        const stats = await workspace.fs.stat(uri);
        if (stats.type === FileType.Directory) {
            return path.join(uri.path, FILE_NAME);
        } else {
            const folderUri = uri.with({ path: path.dirname(uri.path) });
            const folderPath = folderUri.fsPath;

            return path.join(folderPath, FILE_NAME);
        }
    }

    private async getOverrideOption(): Promise<boolean> {
        return this.filePath && fileExists(this.filePath)
            ? await this.get(getOverrideOption)
            : true;
    }

    private async getSelectedOptions(): Promise<string[]> {
        const message = window.setStatusBarMessage(MESSAGES.fetching);

        const list = await getList(this.filePath, !this.override, this.eol, this.isWorkspaceRoot);
        message.dispose();

        if (list === null) {
            window.showErrorMessage(MESSAGES.network_error);
            return [];
        }

        return await this.get(getItemsOption, list) || [];
    }

    private async generate(): Promise<void> {
        const message = window.setStatusBarMessage(MESSAGES.generating);

        if (this.selected.length === 0) {
            window.showErrorMessage(MESSAGES.no_selection);
            message.dispose();
            return;
        }

        let data = await getData(`${API_URL}/${this.selected.join(",")}`);

        if (hitAntiDdos(data)) {
            data = await getData(`${ALTERNATIVE_API_URL}/${this.selected.join(",")}`);
        }

        if (data === null) {
            window.showErrorMessage(MESSAGES.network_error);
            message.dispose();
            return;
        }

        const output = generateFile(this.filePath as string, data, this.override)
            .replace(/\r?\n/g, this.eol);

        if (this.filePath) {
            const result = writeFile(this.filePath, output);

            if (result === false) {
                message.dispose();
                window.showErrorMessage(MESSAGES.save_error);
                this.abort();
            }

            openFile(this.filePath);
        } else {
            openUntitledFile(output);
        }

        message.dispose();

        window.setStatusBarMessage(
            MESSAGES.generated.replace(
                "[action]",
                this.override ? "created" : "updated"
            ),
            3000
        );
    }

    private abort(): void {
        throw new Error("Extension action aborted");
    }
}
