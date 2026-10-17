import * as vscode from "vscode";
import * as https from "https";
import {
    CONFIG_GITHUB_TOKEN,
    CONFIG_SECTION,
    GITHUB_API_TREES_URL,
    RAW_GITHUB_CONTENT_URL
} from "../constants";
import { GitignoreTemplate } from "../types";
import { CacheManager } from "./cacheManager";

import fallbackTemplates from "../data/fallbackTemplates.json";

export class TemplateService {
    private static readonly INDEX_CACHE_KEY = "cleanGitignore_index";
    private static readonly TEMPLATE_CONTENT_PREFIX = "cleanGitignore_content_";

    constructor(private cacheManager: CacheManager) {}

    public async promptSignIn(): Promise<boolean> {
        try {
            const session = await vscode.authentication.getSession("github", ["read:user"], { createIfNone: true });
            if (session?.accessToken) {
                vscode.window.showInformationMessage(`Signed in with GitHub as ${session.account.label}.`);
                return true;
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`GitHub sign-in failed: ${err.message || err}`);
        }
        return false;
    }

    private async getAuthToken(createIfNone = false): Promise<string | null> {
        // 1. Check user configured setting (optional fallback)
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        const token = config.get<string | null>(CONFIG_GITHUB_TOKEN, null);
        if (token && token.trim()) {
            return token.trim();
        }

        // 2. Check if user is logged into GitHub via VS Code
        try {
            const session = await vscode.authentication.getSession("github", ["read:user"], { createIfNone });
            if (session?.accessToken) {
                return session.accessToken;
            }
        } catch {
            // Ignore authentication provider errors
        }

        return null;
    }

    private httpGet(url: string, headers: Record<string, string> = {}): Promise<{ statusCode: number; data: string }> {
        return new Promise((resolve, reject) => {
            const reqUrl = new URL(url);
            const req = https.request(
                {
                    hostname: reqUrl.hostname,
                    path: reqUrl.pathname + reqUrl.search,
                    method: "GET",
                    headers: {
                        "User-Agent": "vscode-clean-gitignore-generator",
                        ...headers,
                    },
                },
                (res) => {
                    let data = "";
                    res.on("data", (chunk) => {
                        data += chunk;
                    });
                    res.on("end", () => {
                        resolve({ statusCode: res.statusCode || 200, data });
                    });
                }
            );

            req.on("error", (err) => {
                reject(err);
            });
            req.end();
        });
    }

    private async parseAndCacheTree(data: string): Promise<GitignoreTemplate[]> {
        const json = JSON.parse(data);
        if (!json.tree || !Array.isArray(json.tree)) {
            throw new Error("Invalid response format from GitHub API");
        }

        const templates: GitignoreTemplate[] = [];

        for (const item of json.tree) {
            const filePath: string = item.path;
            if (!filePath.endsWith(".gitignore")) {
                continue;
            }

            const parts = filePath.split("/");
            const fileName = parts[parts.length - 1];
            const name = fileName.replace(/\.gitignore$/, "");

            if (parts.length === 1) {
                // Root template
                templates.push({
                    name,
                    path: filePath,
                    category: "root",
                });
            } else if (parts[0] === "Global") {
                // Global template
                templates.push({
                    name,
                    path: filePath,
                    category: "global",
                });
            } else if (parts[0] === "community") {
                // Community template
                const subCategory = parts.length > 2 ? parts[1] : undefined;
                templates.push({
                    name,
                    path: filePath,
                    category: "community",
                    subCategory,
                });
            }
        }

        // Cache the parsed template list
        await this.cacheManager.set(TemplateService.INDEX_CACHE_KEY, templates);
        return templates;
    }

    public async getTemplates(): Promise<GitignoreTemplate[]> {
        // Check cache
        const cached = this.cacheManager.get<GitignoreTemplate[]>(TemplateService.INDEX_CACHE_KEY);
        if (cached && cached.length > 0) {
            return cached;
        }

        // Fetch from GitHub Trees API
        const token = await this.getAuthToken(false);
        const headers: Record<string, string> = {
            "Accept": "application/vnd.github.v3+json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const res = await this.httpGet(GITHUB_API_TREES_URL, headers);

            if (res.statusCode === 403 || res.statusCode === 429) {
                // Rate limit exceeded: prompt 1-click VS Code GitHub sign-in or fall back to bundled catalog
                const choice = await vscode.window.showWarningMessage(
                    "GitHub API rate limit reached. Sign in with GitHub for 5,000 requests/hour, or use bundled templates?",
                    "Sign in with GitHub",
                    "Use Bundled Catalog"
                );

                if (choice === "Sign in with GitHub") {
                    const signedIn = await this.promptSignIn();
                    if (signedIn) {
                        const refreshedToken = await this.getAuthToken(false);
                        if (refreshedToken) {
                            headers["Authorization"] = `Bearer ${refreshedToken}`;
                            const retryRes = await this.httpGet(GITHUB_API_TREES_URL, headers);
                            if (retryRes.statusCode === 200) {
                                return await this.parseAndCacheTree(retryRes.data);
                            }
                        }
                    }
                }

                // Fall back to bundled catalog
                return fallbackTemplates as GitignoreTemplate[];
            }

            if (res.statusCode !== 200) {
                return fallbackTemplates as GitignoreTemplate[];
            }

            return await this.parseAndCacheTree(res.data);
        } catch {
            // Network failure or offline: seamlessly fall back to bundled templates
            return fallbackTemplates as GitignoreTemplate[];
        }
    }

    public async getTemplateContent(template: GitignoreTemplate): Promise<string> {
        const cacheKey = `${TemplateService.TEMPLATE_CONTENT_PREFIX}${template.path}`;
        const cached = this.cacheManager.get<string>(cacheKey);
        if (cached !== null) {
            return cached;
        }

        const url = `${RAW_GITHUB_CONTENT_URL}/${template.path}`;
        const res = await this.httpGet(url);

        if (res.statusCode !== 200) {
            throw new Error(`Failed to download template "${template.name}" (HTTP ${res.statusCode})`);
        }

        await this.cacheManager.set(cacheKey, res.data);
        return res.data;
    }

    public async refreshCache(): Promise<void> {
        await this.cacheManager.clear();
    }
}
