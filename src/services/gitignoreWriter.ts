import {
    MANAGED_START_MARKER,
    MANAGED_END_MARKER,
    SECTION_PREFIX,
    SECTION_SUFFIX
} from "../constants";

export interface WriteGitignoreOptions {
    customRules: string;
    sections: Map<string, string>; // templateName -> template content
    sectionOrder: string[];         // desired order of templates
    eol: string;
}

export function buildGitignoreContent(options: WriteGitignoreOptions): string {
    const { customRules, sections, sectionOrder, eol } = options;
    const parts: string[] = [];

    // 1. Custom section ALWAYS at top (preserved if present)
    const customContent = customRules.trim();
    if (customContent) {
        parts.push(customContent);
        parts.push(""); // blank separator line
    }

    // 2. Start of managed templates block
    parts.push(MANAGED_START_MARKER);
    parts.push("");

    // 3. Template sections
    const writtenSections = new Set<string>();

    for (const name of sectionOrder) {
        const content = sections.get(name);
        if (content !== undefined) {
            parts.push(`${SECTION_PREFIX}${name}${SECTION_SUFFIX}`);
            const normalizedContent = content.trim();
            if (normalizedContent) {
                parts.push(normalizedContent);
            }
            parts.push(""); // blank line after each section
            writtenSections.add(name);
        }
    }

    // In case any section in map was not in sectionOrder, append it
    for (const [name, content] of sections.entries()) {
        if (!writtenSections.has(name)) {
            parts.push(`${SECTION_PREFIX}${name}${SECTION_SUFFIX}`);
            const normalizedContent = content.trim();
            if (normalizedContent) {
                parts.push(normalizedContent);
            }
            parts.push("");
        }
    }

    // 4. End of managed templates block
    parts.push(MANAGED_END_MARKER);
    parts.push(""); // final newline

    return parts.join(eol);
}
