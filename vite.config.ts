import { PluginOption, defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";
import monkey from 'vite-plugin-monkey';

export default defineConfig(({ mode }) => {
    console.log("Building in", mode);
    return {
        plugins: [
            bundlePlugin,
            react({
                tsDecorators: true,
            }),
            monkey({
                entry: 'src/index.tsx',
                userscript: {
                    namespace: 'soop_chat_styler',
                    match: ['https://www.google.com/'],
                    grant: ['GM_setValue', 'GM_getValue'],
                },
                server: {
                    mountGmApi: true,
                    open: false
                },
                build: {
                    fileName: 'userscripts.user.js'
                }
            }),
            splitVendorChunkPlugin(),
        ],
        base: "./",
        root: "./",
        build: {
            cssCodeSplit: false,
            cssMinify: false,
            emptyOutDir: false,
            outDir: "dist",
            minify: false,
            sourcemap: false,
            chunkSizeWarningLimit: 1500,
            lib: {
                entry: "src/index.tsx",
                name: "userscript",
                fileName: () => `userscripts.user.js`,
                formats: ["iife"],
            },
            rollupOptions: {
                output: {
                    banner: `// ==UserScript==`,
                    inlineDynamicImports: true,
                },
            },
        },
        define: {
            "process.env.NODE_ENV": JSON.stringify(mode),
        },
        resolve: {
            alias: {
                "@Assets": path.resolve(__dirname, "src/Assets"),
                "@Types": path.resolve(__dirname, "src/@types"),
                "@Views": path.resolve(__dirname, "src/Views"),
                "@Pages": path.resolve(__dirname, "src/Pages"),
                "@Templates": path.resolve(__dirname, "src/Templates"),
                "@Models": path.resolve(__dirname, "src/Models"),
                "@Utils": path.resolve(__dirname, "src/Utils"),
                "@Components": path.resolve(__dirname, "src/Components"),
                "@Stores": path.resolve(__dirname, "src/Stores"),
                "@Styles": path.resolve(__dirname, "src/Styles"),
                "@Widgets": path.resolve(__dirname, "src/Widgets"),
                "@Module": path.resolve(__dirname, "src/Module"),
            },
        },
    };
});

const bundlePlugin: PluginOption = {
    name: "bundle-plugin",
    apply: "build",
    enforce: "post",
    generateBundle(options, bundle) {
        let css = "";
        for (const fileName in bundle) {
            const chunk = bundle[fileName];
            if (chunk.type === "asset" && chunk.fileName.endsWith(".css")) {
                console.log(
                    "\nFound CSS chunk",
                    chunk.fileName,
                    "Inlining and removing from bundle."
                );
                css += chunk.source;
                delete bundle[fileName];
            }
        }
        for (const fileName in bundle) {
            const chunk = bundle[fileName];
            if (chunk.type === "chunk") {
                // This may mess the source map :-(
                chunk.code = addHeader(chunk.code);

                // Inject the CSS into the bundle
                chunk.code += `;\n(function(){
                    const el = document.createElement("style");
                    el.innerText = ${JSON.stringify(css)};
                    el.type = "text/css";
                    document.head.appendChild(el);
                })();`;
            }
        }

        function addHeader(code: string) {
            const header = fs.readFileSync("src/userscript-header.ts", "utf-8");
            const now = new Date();
            const version = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
            const updatedHeader = header.replace(/@version\s+[\d]+/, `@version      ${version}`);

            console.log("\nAdding header to userscript:\n", updatedHeader);

            return `${updatedHeader}\n${code}`;
        }
    },
};