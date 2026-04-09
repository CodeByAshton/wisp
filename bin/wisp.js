#!/usr/bin/env node
/**
 * WISP CLI entry point
 * Usage:
 *   npx wisp
 *   npx wisp --dir ../my-app/src/components
 *   npx wisp --dir ../my-app/src/components --glob "**\/*.stories.tsx"
 *   npx wisp --port 5174
 */

import { createServer } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { parseArgs } from 'util'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

// Parse CLI args
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    dir: { type: 'string', short: 'd' },
    glob: { type: 'string', short: 'g' },
    port: { type: 'string', short: 'p' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
})

if (values.help) {
  console.log(`
WISP — Component Explorer

Usage:
  wisp [options]

Options:
  -d, --dir <path>    Path to stories directory (absolute or relative)
  -g, --glob <glob>   Glob pattern for story files (default: **/*.stories.tsx)
  -p, --port <port>   Dev server port (default: 5174)
  -h, --help          Show this help

Examples:
  wisp
  wisp --dir ../my-app/src/components
  wisp --dir /Users/ashton/projects/myapp/src/components
  wisp --dir ../my-app/src --glob "**/*.stories.tsx"
  wisp --port 3000
`)
  process.exit(0)
}

// Set env vars that the Vite plugin will read
if (values.dir) {
  process.env.WISP_STORIES_DIR = resolve(process.cwd(), values.dir)
  console.log(`[wisp] Using stories directory: ${process.env.WISP_STORIES_DIR}`)
}

if (values.glob) {
  process.env.WISP_STORIES_GLOB = values.glob
}

if (values.port) {
  process.env.WISP_PORT = values.port
}

// Change to project root so Vite finds vite.config.ts
process.chdir(projectRoot)

// Dynamic import after env vars are set
const { default: viteConfig } = await import('../vite.config.ts')

const server = await createServer({
  ...viteConfig,
  server: {
    ...viteConfig.server,
    port: values.port ? parseInt(values.port) : (viteConfig.server?.port ?? 5174),
    open: true,
  },
})

await server.listen()
server.printUrls()

process.on('SIGTERM', () => server.close())
process.on('SIGINT', () => server.close())
