import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, cpSync } from 'fs'
import { build as esbuild } from 'esbuild'

// Plugin to copy manifest and public files (icons, locales)
function copyManifest(targetBrowser: string, outDir: string) {
  return {
    name: 'copy-manifest',
    closeBundle() {
      const distDir = resolve(__dirname, outDir)
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true })
      }

      // Copy the appropriate manifest based on target browser
      // Edge uses the same manifest as Chrome
      const manifestSource = targetBrowser === 'firefox'
        ? resolve(__dirname, 'manifests/manifest.firefox.json')
        : targetBrowser === 'chrome' || targetBrowser === 'edge'
        ? resolve(__dirname, 'manifests/manifest.chrome.json')
        : resolve(__dirname, 'manifest.json') // fallback to root manifest

      copyFileSync(
        manifestSource,
        resolve(distDir, 'manifest.json')
      )

      console.log(`✅ Copied ${targetBrowser} manifest to ${outDir}/manifest.json`)

      // Copy browser-specific public files (icons, _locales)
      const publicSource = targetBrowser === 'firefox'
        ? resolve(__dirname, 'public_firefox')
        : targetBrowser === 'edge'
        ? resolve(__dirname, 'public_edge')
        : targetBrowser === 'chrome'
        ? resolve(__dirname, 'public_chrome')
        : resolve(__dirname, 'public')

      if (existsSync(publicSource)) {
        cpSync(publicSource, distDir, { recursive: true })
        console.log(`✅ Copied public files from ${publicSource.split('/').pop()} to ${outDir}/`)
      }
    }
  }
}

// Re-bundle the content script as a single file (no imports) for MV3 compatibility
function bundleContentScript(mode: string, outDir: string) {
  return {
    name: 'bundle-content-script',
    async writeBundle() {
      const distDir = resolve(__dirname, outDir)
      const isProduction = mode === 'production'

      await esbuild({
        entryPoints: [resolve(__dirname, 'src/content-script.ts')],
        bundle: true,
        outfile: resolve(distDir, 'content-script.js'),
        format: 'iife',
        platform: 'browser',
        target: 'es2020',
        define: {
          'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
          __VUE_OPTIONS_API__: 'true',
          __VUE_PROD_DEVTOOLS__: 'false',
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
        },
        drop: isProduction ? ['console', 'debugger'] : undefined,
        // Aggressive minification for production content script
        minify: isProduction,
        minifyWhitespace: isProduction,
        minifyIdentifiers: isProduction,
        minifySyntax: isProduction,
        treeShaking: isProduction,
        sourcemap: !isProduction ? 'inline' : false,
        keepNames: !isProduction,
        logLevel: 'silent'
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  // Determine target browser and output directory from environment variables
  const targetBrowser = process.env.TARGET_BROWSER || 'chrome'
  const outDir = process.env.OUT_DIR || (
    targetBrowser === 'firefox' ? 'dist-firefox'
    : targetBrowser === 'edge' ? 'dist-edge'
    : targetBrowser === 'chrome' ? 'dist-chrome'
    : 'dist'
  )

  console.log(`🔨 Building for ${targetBrowser} → ${outDir}`)

  return {
    publicDir: false, // Disable default public copy (we handle it manually in copyManifest plugin)
    plugins: [vue(), copyManifest(targetBrowser, outDir), bundleContentScript(mode, outDir)],
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: mode === 'development' ? 'inline' : false, // Inline source maps in dev, none in prod
      minify: mode === 'production' ? 'terser' : false, // Use Terser for production minification
      terserOptions:
        mode === 'production'
          ? {
              compress: {
                pure_funcs: ['console.log', 'console.debug', 'console.warn'], // Keep console.error
                drop_debugger: true,
                passes: 2,         // Two compression passes for better results
                dead_code: true,   // Remove unreachable code
                conditionals: true, // Optimize conditionals
                evaluate: true,    // Evaluate constant expressions
                booleans: true,    // Optimize boolean expressions
                loops: true,       // Optimize loops
                unused: true,      // Remove unused variables/functions
                if_return: true,   // Optimize if/return sequences
                join_vars: true,   // Join consecutive var declarations
              },
              mangle: {
                safari10: true, // Workaround for Safari 10 bugs
              },
              format: {
                comments: false, // Remove comments
                ecma: 2020,      // Target ES2020 output
              },
            }
          : undefined,
      rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        'content-script': resolve(__dirname, 'src/content-script.ts'),
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        'whats-new': resolve(__dirname, 'src/whats-new/whats-new.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: (chunkInfo) => {
          // Remove underscore prefix — Chrome forbids files starting with "_"
          const name = chunkInfo.name.replace(/^_/, '')
          return `${name}.js`
        },
        assetFileNames: '[name].[ext]',
        // Group Vue runtime into a dedicated chunk
        manualChunks(id) {
          if (id.includes('node_modules') && (id.includes('/vue/') || id.includes('/@vue/'))) {
            return 'vue-runtime'
          }
        },
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
}})
