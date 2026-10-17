import * as assert from "assert";
import fallbackTemplates from "../../data/fallbackTemplates.json";
import { TemplateService } from "../../services/templateService";

describe("Template Service & Fallback Catalog Tests", () => {
    it("should have over 300 templates in the bundled fallback catalog", () => {
        assert.ok(Array.isArray(fallbackTemplates));
        assert.ok(fallbackTemplates.length > 300, `Expected > 300 templates, got ${fallbackTemplates.length}`);
    });

    it("should contain essential templates in the catalog", () => {
        const names = new Set(fallbackTemplates.map((t: any) => t.name.toLowerCase()));
        assert.ok(names.has("node"));
        assert.ok(names.has("python"));
        assert.ok(names.has("macos"));
        assert.ok(names.has("visualstudiocode"));
    });

    it("should fall back to bundled catalog if network fails", async () => {
        // Mock cache manager with no cached data
        const mockCacheManager: any = {
            get: () => null,
            set: async () => {},
            clear: async () => {},
        };

        const service = new TemplateService(mockCacheManager);
        // Force httpGet to simulate network error / offline
        (service as any).httpGet = async () => {
            throw new Error("ENOTFOUND api.github.com");
        };

        const templates = await service.getTemplates();
        assert.ok(templates.length > 300);
        assert.ok(templates.some(t => t.name === "Node"));
    });
});
