import { defineConfig } from './src/config'

export default defineConfig({
  // Point to any directory containing *.stories.tsx files
  // Can be an absolute path or relative to this config file
  // Default: uses built-in src/stories/ demo stories
  storiesDir: 'wisp/src/stories',

  // Glob pattern within that directory
  storiesGlob: '**/*.stories.tsx',

  // Optional: additional directories to watch (shared types, utils, etc.)
  // watchDirs: ['../my-app/src/types'],

  // Optional: path aliases that match your project's tsconfig
  // aliases: {
  //   '@': '../my-app/src',
  //   '@components': '../my-app/src/components',
  // },

  // Optional: dev server port
  port: 5174,
})
