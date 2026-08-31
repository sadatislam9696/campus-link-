import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vite's default output dumps every chunk flat into dist/assets with
        // the shared entry bundle opaquely named "index" - not helpful when
        // inspecting a deployed build. Group by type and give the entry
        // bundle a real name; per-page chunk names (Teams, TeamDetail,
        // Admin, ...) already come from their component names and are kept
        // as-is, just relocated under assets/js/.
        entryFileNames: 'assets/js/app-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // Rollup names the CSS extracted from index.html's entry "index"
        // regardless of entryFileNames above, so that case is renamed here
        // too - otherwise the app's own stylesheet reads as "index.css"
        // while every other asset is named after its feature.
        assetFileNames: (asset) => {
          const base = (asset.name ?? 'asset').replace(/\.[^/.]+$/, '')
          const ext = (asset.name ?? '').split('.').pop() || 'misc'
          return `assets/${ext}/${base === 'index' ? 'app' : base}-[hash][extname]`
        },
        manualChunks(id) {
          // Third-party dependencies in their own named chunk, separate from
          // this project's own feature code.
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
