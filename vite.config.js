import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages project site lives at https://USERNAME.github.io/<repo>/
// `base` MUST match the repo name (leading + trailing slash) or assets 404.
// If you name the repo something other than "dsa-study-lab", change this one line.
export default defineConfig({
  base: "/interview-labs/",
  plugins: [react(), tailwindcss()],
});
