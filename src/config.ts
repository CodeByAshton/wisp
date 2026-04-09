export interface WispConfig {
  /**
   * Absolute or relative path to your component stories directory.
   * Relative paths are resolved from the wisp.config.ts location.
   * Default: './src/stories'
   */
  storiesDir?: string

  /**
   * Glob pattern within storiesDir to find story files.
   * Default: '**\/*.stories.tsx'
   */
  storiesGlob?: string

  /**
   * Additional directories to watch for changes (e.g. shared types, utils).
   * Changes here trigger HMR but don't affect story discovery.
   */
  watchDirs?: string[]

  /**
   * Path aliases to resolve when importing from stories.
   * Should match your project's tsconfig compilerOptions.paths.
   * Example: { '@': '../my-app/src', '@components': '../my-app/src/components' }
   */
  aliases?: Record<string, string>

  /**
   * Dev server port. Default: 5174
   */
  port?: number
}

/**
 * Define a WISP configuration with full type safety.
 */
export function defineConfig(config: WispConfig): WispConfig {
  return config
}
