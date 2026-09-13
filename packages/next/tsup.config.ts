import { defineConfig } from "tsup";
export default defineConfig({ entry: ["src/index.tsx"], format: ["esm"], dts: true, target: "es2020", clean: true, external: ["react", "react/jsx-runtime", "next", "kmind-apm-web"] });
