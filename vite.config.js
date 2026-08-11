import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, isAbsolute } from 'node:path'

// Заменяет плейсхолдер __BUILD_ID__ в собранном sw.js на метку времени билда.
// Каждый билд → свой CACHE_NAME → старые кэши вычищаются на activate.
function swBuildIdPlugin() {
  let outDir = 'dist'
  let root = process.cwd()
  return {
    name: 'sw-build-id',
    apply: 'build',
    configResolved(config) {
      outDir = config.build?.outDir || 'dist'
      root = config.root || process.cwd()
    },
    closeBundle() {
      const swPath = isAbsolute(outDir)
        ? resolve(outDir, 'sw.js')
        : resolve(root, outDir, 'sw.js')
      if (!existsSync(swPath)) {
        this.warn?.(`sw.js not found at ${swPath}, skip BUILD_ID injection`)
        return
      }
      const src = readFileSync(swPath, 'utf8')
      const buildId = String(Date.now())
      writeFileSync(swPath, src.replace(/__BUILD_ID__/g, buildId))
      console.log(`[sw] BUILD_ID = ${buildId} (${swPath})`)
    },
  }
}

export default defineConfig({
  plugins: [vue(), swBuildIdPlugin()],
  // Корень собственного домена. CNAME лежит в public/CNAME.
  // base прошит синхронно в пяти местах: здесь, public/manifest.json,
  // public/sw.js, index.html и во внутренних путях через import.meta.env.BASE_URL.
  base: '/',
})
