import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { gzip } from "zlib";
import { promisify } from "util";
import type { Plugin } from "vite";
import { componentTagger } from "lovable-tagger";

const gzipAsync = promisify(gzip);

function gzipAssetsPlugin(): Plugin {
  return {
    name: "gzip-assets-plugin",
    apply: "build",
    async generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!/\.(js|css|html|svg|json)$/.test(fileName)) {
          continue;
        }

        const raw = chunk.type === "asset" ? chunk.source : chunk.code;
        const source = typeof raw === "string" ? raw : Buffer.from(raw);
        if (source.length < 1024) {
          continue;
        }

        const gzipped = await gzipAsync(source);
        this.emitFile({
          type: "asset",
          fileName: `${fileName}.gz`,
          source: gzipped,
        });
      }
    },
  };
}

function bundleStatsPlugin(): Plugin {
  return {
    name: "bundle-stats-plugin",
    apply: "build",
    generateBundle(_, bundle) {
      const stats = Object.entries(bundle)
        .filter(([, output]) => output.type === "chunk")
        .map(([fileName, output]) => ({
          fileName,
          size: output.code.length,
          modules: Object.keys(output.modules).length,
        }))
        .sort((a, b) => b.size - a.size);

      this.emitFile({
        type: "asset",
        fileName: "bundle-stats.json",
        source: JSON.stringify(stats, null, 2),
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), gzipAssetsPlugin(), bundleStatsPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/react-router-dom/")
          ) {
            return "vendor-react";
          }

          if (id.includes("@tanstack/react-query")) {
            return "vendor-query";
          }

          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }

          if (id.includes("@supabase/supabase-js")) {
            return "vendor-supabase";
          }

          if (id.includes("recharts")) {
            return "vendor-charts";
          }

          if (id.includes("zod") || id.includes("date-fns") || id.includes("dompurify")) {
            return "vendor-utils";
          }

          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "src/contexts/AuthContext.tsx",
        "src/contexts/PermissionsContext.tsx",
        "src/features/authPage/hooks/useAuthPage.ts",
        "src/features/exams/hooks/useExamAnswers.ts",
        "src/features/practice/practiceUtils.ts",
        "src/features/practice/hooks/usePracticeRunner.ts",
        "src/features/admin/hooks/useUserManagement.ts",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        statements: 60,
        branches: 35,
      },
    },
  },
}));
