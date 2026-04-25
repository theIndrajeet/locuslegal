import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import path from "path";
import { writeFileSync, mkdirSync } from "fs";
import { componentTagger } from "lovable-tagger";

const BUILD_VERSION = Date.now().toString();

// Writes /version.json into the build output so the running app can poll it
// to detect new deployments and prompt users to refresh.
function writeVersionJsonPlugin(): Plugin {
  return {
    name: "write-version-json",
    apply: "build",
    closeBundle() {
      try {
        const outDir = path.resolve(__dirname, "dist");
        mkdirSync(outDir, { recursive: true });
        writeFileSync(
          path.join(outDir, "version.json"),
          JSON.stringify({ version: BUILD_VERSION }),
          "utf-8"
        );
      } catch (e) {
        console.warn("[write-version-json] failed:", e);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
  },
  plugins: [
    { enforce: "pre" as const, ...mdx({ jsxRuntime: "automatic", development: false, providerImportSource: "@mdx-js/react", remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] }) } as Plugin,
    react(),
    mode === "development" && componentTagger(),
    writeVersionJsonPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
}));
