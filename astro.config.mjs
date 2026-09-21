import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://alejoportfolio.vercel.app",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],

    /*
     * Force a single copy of the 3D stack.
     *
     * Astro loads the island through @astrojs/react's own client entry, which
     * Vite pre-bundles separately from the app's imports. Left alone that
     * produces two optimised copies of three and react-three-fiber, each with
     * its own reconciler and its own Suspense cache -- so a texture resolves
     * inside one copy while the component waiting on it lives in the other, and
     * the scene hangs on a loading screen forever with no error to show for it.
     *
     * dedupe collapses them to one instance; listing them in optimizeDeps keeps
     * that instance stable instead of being re-bundled on the fly.
     */
    resolve: {
      dedupe: [
        "react",
        "react-dom",
        "three",
        "@react-three/fiber",
        "@react-three/drei",
        "@react-three/postprocessing",
      ],
    },
    optimizeDeps: {
      include: [
        "three",
        "@react-three/fiber",
        "@react-three/drei",
        "@react-three/postprocessing",
      ],
    },
  },
});
