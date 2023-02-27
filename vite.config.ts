import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import copy from "rollup-plugin-copy";

export default defineConfig({
  plugins: [
    react(),
    copy({
      targets: [
        { src: "src/manifest.json", dest: "dist" },
        { src: "src/styles", dest: "dist" },
        { src: "src/assets", dest: "dist" },
      ],

      hook: "writeBundle",
    }),
  ],
  build: {
    rollupOptions: {
      input: ["index.html", "src/scripts/background.ts", "src/scripts/store.ts", "src/scripts/global.ts", "src/scripts/find.ts", "src/scripts/mybid.ts"],
      output: {
        chunkFileNames: "[name].[hash].js",
        assetFileNames: "[name].[hash].[ext]",
        entryFileNames: "scripts/[name].js",
        dir: "dist",
      },
    },
  },
});
