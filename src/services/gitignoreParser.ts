import * as fs from "fs";
import {
    MANAGED_START_MARKER,
    MANAGED_END_MARKER,
    LEGACY_START_MARKER,
    LEGACY_END_MARKER,
    SECTION_PREFIX,
    SECTION_SUFFIX
} from "../constants";
import { ParsedGitignore } from "../types";

export function detectEol(content: string): string {
    const crlfCount = (content.match(/\r\n/g) || []).length;
    const lfCount = (content.match(/[^\r]\n/g) || []).length;
    return crlfCount > lfCount ? "\r\n" : "\n";
}

export function parseGitignoreContent(content: string): ParsedGitignore {
    const eol = detectEol(content);
    const sections = new Map<string, string>();
    const sectionOrder: string[] = [];

    // Find managed boundaries (support modern and legacy markers)
    let startIndex = content.indexOf(MANAGED_START_MARKER);
    let startMarkerLength = MANAGED_START_MARKER.length;
    let endIndex = content.indexOf(MANAGED_END_MARKER);
    let endMarkerLength = MANAGED_END_MARKER.length;

    if (startIndex === -1 || endIndex === -1) {
        startIndex = content.indexOf(LEGACY_START_MARKER);
        startMarkerLength = LEGACY_START_MARKER.length;
        endIndex = content.indexOf(LEGACY_END_MARKER);
        endMarkerLength = LEGACY_END_MARKER.length;
    }

    // If managed boundary markers are not present, treat entire file as custom rules
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
        return {
            customRules: content.trim(),
            sections,
            sectionOrder,
            eol,
            hasManagedBlock: false,
        };
    }

    // Custom rules: everything before start marker
    const customRules = content.slice(0, startIndex).trim();

    // Any accidental content placed after the end marker is also preserved
    const afterEnd = content.slice(endIndex + endMarkerLength).trim();
    const finalCustomRules = afterEnd ? (customRules ? `${customRules}${eol}${eol}${afterEnd}` : afterEnd) : customRules;

    // Managed body: between start marker and end marker
    const managedBody = content.slice(startIndex + startMarkerLength, endIndex);
    const lines = managedBody.split(/\r?\n/);

    let currentSectionName: string | null = null;
    let currentLines: string[] = [];

    const commitSection = () => {
        if (currentSectionName !== null) {
            const sectionContent = currentLines.join(eol).trim();
            sections.set(currentSectionName, sectionContent);
            if (!sectionOrder.includes(currentSectionName)) {
                sectionOrder.push(currentSectionName);
            }
            currentLines = [];
        }
    };

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith(SECTION_PREFIX) && line.endsWith(SECTION_SUFFIX)) {
            commitSection();
            const rawName = line.slice(SECTION_PREFIX.length, -SECTION_SUFFIX.length).trim();
            currentSectionName = rawName;
        } else if (currentSectionName !== null) {
            currentLines.push(rawLine);
        }
    }
    commitSection();

    return {
        customRules: finalCustomRules,
        sections,
        sectionOrder,
        eol,
        hasManagedBlock: true,
    };
}

export function parseGitignoreFile(filePath: string): ParsedGitignore {
    if (!fs.existsSync(filePath)) {
        return {
            customRules: "",
            sections: new Map(),
            sectionOrder: [],
            eol: process.platform === "win32" ? "\r\n" : "\n",
            hasManagedBlock: false,
        };
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return parseGitignoreContent(content);
}
