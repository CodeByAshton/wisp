import type { Plugin, ViteDevServer } from 'vite'
import { resolve, join, relative } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { glob } from 'fs/promises'
import type { WispConfig } from '../config'

const VIRTUAL_ID = 'virtual:wisp-stories'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID
const CONFIG_FILENAME = 'wisp.config.ts'

interface ResolvedWispConfig extends WispConfig {
  resolvedStoriesDir: string
  resolvedWatchDirs: string[]
}

function loadWispConfig(root: string): ResolvedWispConfig {
  // CLI env var takes precedence over wisp.config.ts
  const envDir = process.env.WISP_STORIES_DIR
  const envGlob = process.env.WISP_STORIES_GLOB

  let fileConfig: WispConfig = {}

  const configPath = join(root, CONFIG_FILENAME)
  if (existsSync(configPath)) {
    try {
      // Read and eval the config — simple approach for TS config files
      const raw = readFileSync(configPath, 'utf-8')
      // Extract storiesDir from the config file via regex (avoids full TS compilation)
      const dirMatch = raw.match(/storiesDir\s*:\s*['"`]([^'"`]+)['"`]/)
      const globMatch = raw.match(/storiesGlob\s*:\s*['"`]([^'"`]+)['"`]/)
      const portMatch = raw.match(/port\s*:\s*(\d+)/)
      const aliasMatches = [...raw.matchAll(/['"`]([^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/g)]

      if (dirMatch) fileConfig.storiesDir = dirMatch[1]
      if (globMatch) fileConfig.storiesGlob = globMatch[1]
      if (portMatch) fileConfig.port = parseInt(portMatch[1])

      // Parse aliases block
      const aliasBlock = raw.match(/aliases\s*:\s*\{([^}]+)\}/)
      if (aliasBlock) {
        const aliases: Record<string, string> = {}
        const pairs = aliasBlock[1].matchAll(/['"`]([^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/g)
        for (const [, key, val] of pairs) {
          aliases[key] = val
        }
        fileConfig.aliases = aliases
      }
    } catch {
      // Config parse error — use defaults
    }
  }

  const storiesDir = envDir ?? fileConfig.storiesDir ?? join(root, 'src/stories')
  const resolvedStoriesDir = resolve(root, storiesDir)

  const watchDirs = fileConfig.watchDirs ?? []
  const resolvedWatchDirs = watchDirs.map(d => resolve(root, d))

  return {
    ...fileConfig,
    storiesDir,
    storiesGlob: envGlob ?? fileConfig.storiesGlob ?? '**/*.stories.tsx',
    resolvedStoriesDir,
    resolvedWatchDirs,
  }
}

async function discoverStoryFiles(storiesDir: string, globPattern: string): Promise<string[]> {
  if (!existsSync(storiesDir)) return []

  try {
    const files: string[] = []
    for await (const entry of glob(globPattern, { cwd: storiesDir })) {
      files.push(join(storiesDir, entry as string))
    }
    return files.sort()
  } catch {
    return []
  }
}

function generateVirtualModule(storyFiles: string[], root: string): string {
  if (storyFiles.length === 0) {
    return `export default []`
  }

  const imports = storyFiles
    .map((f, i) => `import * as story${i} from ${JSON.stringify(f)}`)
    .join('\n')

  const exports = storyFiles
    .map((f, i) => `  { module: story${i}, filePath: ${JSON.stringify(relative(root, f))} }`)
    .join(',\n')

  return `${imports}\n\nexport default [\n${exports}\n]`
}

export function wispPlugin(): Plugin[] {
  let root = process.cwd()
  let config: ResolvedWispConfig
  let server: ViteDevServer | undefined
  let storyFiles: string[] = []

  async function refresh() {
    storyFiles = await discoverStoryFiles(config.resolvedStoriesDir, config.storiesGlob ?? '**/*.stories.tsx')
    if (server) {
      const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
      if (mod) {
        server.moduleGraph.invalidateModule(mod)
      }
      server.ws.send({ type: 'full-reload', path: '*' })
    }
  }

  const virtualPlugin: Plugin = {
    name: 'wisp:virtual',
    enforce: 'pre',

    configResolved(resolvedConfig) {
      root = resolvedConfig.root
      config = loadWispConfig(root)
    },

    async buildStart() {
      config = loadWispConfig(root)
      storyFiles = await discoverStoryFiles(config.resolvedStoriesDir, config.storiesGlob ?? '**/*.stories.tsx')
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
      return null
    },

    async load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        return generateVirtualModule(storyFiles, root)
      }
      return null
    },

    configureServer(devServer) {
      server = devServer

      // Watch the stories directory with chokidar (bundled with Vite)
      function setupWatcher() {
        if (!config) return

        const { resolvedStoriesDir, resolvedWatchDirs } = config
        const dirsToWatch = [resolvedStoriesDir, ...resolvedWatchDirs].filter(Boolean)

        const watcher = devServer.watcher
        dirsToWatch.forEach(dir => {
          if (existsSync(dir)) {
            watcher.add(dir)
          }
        })

        watcher.on('add', async (filePath: string) => {
          if (filePath.endsWith('.stories.tsx') || filePath.endsWith('.stories.ts')) {
            await refresh()
            devServer.ws.send({
              type: 'custom',
              event: 'wisp:stories-changed',
              data: { action: 'add', path: filePath },
            })
          }
        })

        watcher.on('unlink', async (filePath: string) => {
          if (filePath.endsWith('.stories.tsx') || filePath.endsWith('.stories.ts')) {
            await refresh()
            devServer.ws.send({
              type: 'custom',
              event: 'wisp:stories-changed',
              data: { action: 'remove', path: filePath },
            })
          }
        })

        watcher.on('change', async (filePath: string) => {
          if (filePath.endsWith('.stories.tsx') || filePath.endsWith('.stories.ts')) {
            devServer.ws.send({
              type: 'custom',
              event: 'wisp:stories-changed',
              data: { action: 'change', path: filePath },
            })
          }
          // Also watch wisp.config.ts
          if (filePath.endsWith(CONFIG_FILENAME)) {
            config = loadWispConfig(root)
            await refresh()
          }
        })
      }

      setupWatcher()

      // API endpoint: POST /wisp-api/set-directory
      devServer.middlewares.use('/wisp-api/set-directory', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', async () => {
          try {
            const { directory, glob: globPattern } = JSON.parse(body)

            // Update wisp.config.ts
            const configPath = join(root, CONFIG_FILENAME)
            if (existsSync(configPath)) {
              let configContent = readFileSync(configPath, 'utf-8')

              if (directory) {
                const normalizedDir = directory.replace(/\\/g, '/')
                configContent = configContent.replace(
                  /storiesDir\s*:\s*['"`][^'"`]*['"`]/,
                  `storiesDir: '${normalizedDir}'`
                )
                // If storiesDir not found, insert it
                if (!configContent.includes('storiesDir')) {
                  configContent = configContent.replace(
                    /defineConfig\(\{/,
                    `defineConfig({\n  storiesDir: '${normalizedDir}',`
                  )
                }
              }

              if (globPattern) {
                configContent = configContent.replace(
                  /storiesGlob\s*:\s*['"`][^'"`]*['"`]/,
                  `storiesGlob: '${globPattern}'`
                )
              }

              writeFileSync(configPath, configContent, 'utf-8')
            }

            // Reload config and refresh
            config = loadWispConfig(root)

            // Re-add the new directory to the watcher
            if (directory && existsSync(resolve(directory))) {
              devServer.watcher.add(resolve(directory))
            }

            await refresh()

            const count = storyFiles.length
            const dirExists = existsSync(config.resolvedStoriesDir)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
              success: true,
              storyCount: count,
              dirExists,
              resolvedDir: config.resolvedStoriesDir,
            }))
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: String(err) }))
          }
        })
      })

      // API endpoint: GET /wisp-api/status
      devServer.middlewares.use('/wisp-api/status', (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405)
          res.end('Method not allowed')
          return
        }

        const dirExists = existsSync(config?.resolvedStoriesDir ?? '')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          storiesDir: config?.resolvedStoriesDir ?? '',
          storiesGlob: config?.storiesGlob ?? '**/*.stories.tsx',
          storyCount: storyFiles.length,
          dirExists,
          aliases: config?.aliases ?? {},
        }))
      })
    },
  }

  // Alias plugin — injects config aliases into Vite's resolve
  const aliasPlugin: Plugin = {
    name: 'wisp:aliases',
    enforce: 'pre',

    config() {
      const cfg = loadWispConfig(process.cwd())
      if (!cfg.aliases) return {}

      const alias = Object.entries(cfg.aliases).map(([find, replacement]) => ({
        find,
        replacement: resolve(process.cwd(), replacement),
      }))

      return { resolve: { alias } }
    },
  }

  return [aliasPlugin, virtualPlugin]
}
