import * as os from "os";
import { readFile } from "./filesystem";
import { getData } from "./http";
import { API_URL, ALTERNATIVE_API_URL, USER_RULES } from "./config";

export function hitAntiDdos(value: string | null): boolean {
    return value !== null && /^<!DOCTYPE.*>/gi.test(value.trim());
}

export async function getList(
    path: string | null,
    keepCurrent: boolean,
    eol: string = "\n",
    isWorkspaceRoot: boolean = false,
): Promise<Array<{ label: string; picked: boolean }> | null> {
    let data: string | null = await getData(`${API_URL}/list`);

    if (hitAntiDdos(data)) {
        data = await getData(`${ALTERNATIVE_API_URL}/list`);
    }

    if (data === null) {
        return null;
    }

    const selectedItems = getSelectedItems(path, keepCurrent, eol, isWorkspaceRoot);
    const items = data.split(new RegExp(`[${eol},]+`)).map(item => ({
        label: item,
        picked: selectedItems.includes(item),
    }));

    if (items.length > 0 && items[items.length - 1].label === "") {
        items.pop();
    }

    items.sort((a, b) => (a.picked ? -1 : b.picked ? 1 : 0));

    return items;
}

export function getOs(): string | null {
    const systems: { [key: string]: string } = {
        darwin: "macos",
        linux: "linux",
        win32: "windows",
    };

    return systems[os.platform()] || null;
}

export function getCurrentItems(path: string, eol: string = "\n"): string[] {
    const file = readFile(path);

    if (file === null) {
        return [];
    }

    const regex = /^# Created by.+\/(.+)$/m;
    const result = regex.exec(file);

    return result && result[1] ? result[1].split(",") : [];
}

export function getUserRules(filePath: string, eol: string = "\n"): string | null {
    const file = readFile(filePath);

    if (file === null) {
        return null;
    }

    const result = file.split(USER_RULES)[1];

    return result ? result.trim() : null;
}

export function getSelectedItems(
    filePath: string | null,
    keepCurrent: boolean,
    eol: string = "\n",
    isWorkspaceRoot: boolean = false
): string[] {
    const selected: string[] = [];

    if (!keepCurrent && isWorkspaceRoot) {
        selected.push("visualstudiocode", getOs() || "");
    }
    if (keepCurrent && filePath) {
        selected.push(...getCurrentItems(filePath, eol));
    }

    return selected.filter(item => !!item);
}

export function generateFile(path: string, output: string, override: boolean, eol: string = "\n"): string {
    output = `${output}${eol}#${USER_RULES}`;

    if (!override) {
        const userRules = getUserRules(path, eol);
        if (userRules) {
            output += `${eol}${userRules}`;
        }
    }

    return `${output}${eol}`;
}
