import * as vscode from "vscode";
import { CONFIG_CACHE_TTL_HOURS, CONFIG_SECTION } from "../constants";

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export class CacheManager {
    private memoryCache = new Map<string, CacheEntry<any>>();

    constructor(private context: vscode.ExtensionContext) {}

    private getTtlMilliseconds(): number {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        const hours = config.get<number>(CONFIG_CACHE_TTL_HOURS, 24);
        return Math.max(1, hours) * 60 * 60 * 1000;
    }

    public get<T>(key: string): T | null {
        const now = Date.now();
        const ttl = this.getTtlMilliseconds();

        // 1. Check memory cache
        const memItem = this.memoryCache.get(key);
        if (memItem) {
            if (now - memItem.timestamp < ttl) {
                return memItem.data as T;
            }
            this.memoryCache.delete(key);
        }

        // 2. Check globalState persistent cache
        const stored = this.context.globalState.get<CacheEntry<T>>(key);
        if (stored) {
            if (now - stored.timestamp < ttl) {
                this.memoryCache.set(key, stored);
                return stored.data;
            }
            this.context.globalState.update(key, undefined);
        }

        return null;
    }

    public async set<T>(key: string, data: T): Promise<void> {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
        };
        this.memoryCache.set(key, entry);
        await this.context.globalState.update(key, entry);
    }

    public async clear(prefix?: string): Promise<void> {
        this.memoryCache.clear();
        const keys = this.context.globalState.keys();
        for (const k of keys) {
            if (!prefix || k.startsWith(prefix)) {
                await this.context.globalState.update(k, undefined);
            }
        }
    }
}
