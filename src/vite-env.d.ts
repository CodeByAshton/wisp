/// <reference types="vite/client" />

// CSS Modules
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

// Virtual module
declare module 'virtual:wisp-stories' {
  import type { StoryModule } from './types/story'
  const stories: Array<{ module: StoryModule; filePath: string }>
  export default stories
}
