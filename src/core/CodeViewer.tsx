import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { ResolvedStory } from '../types/story'
import styles from './CodeViewer.module.css'

interface CodeViewerProps {
  story: ResolvedStory | undefined
  args: Record<string, unknown>
}

// Lightweight syntax highlighter — no external parser
function highlight(code: string): string {
  // Order matters — most specific first
  return code
    // Strings
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
      '<span class="tok-string">$1</span>')
    // JSX tags
    .replace(/(&lt;\/?[\w.]+)/g, '<span class="tok-tag">$1</span>')
    .replace(/(\/&gt;|&gt;)/g, '<span class="tok-tag">$1</span>')
    // Props/attributes (word before =)
    .replace(/\b([\w-]+)(?==)/g, '<span class="tok-attr">$1</span>')
    // Keywords
    .replace(/\b(import|export|from|const|let|var|function|return|type|interface|default|as)\b/g,
      '<span class="tok-keyword">$1</span>')
    // JSX expression braces
    .replace(/([{}])/g, '<span class="tok-brace">$1</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="tok-number">$1</span>')
    // Comments
    .replace(/(\/\/[^\n]*)/g, '<span class="tok-comment">$1</span>')
}

function argsToJSXString(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([key, value]) => {
      if (typeof value === 'string') return `  ${key}="${value}"`
      if (typeof value === 'boolean') return value ? `  ${key}` : `  ${key}={false}`
      return `  ${key}={${JSON.stringify(value)}}`
    })
    .join('\n')
}

function generateUsageSnippet(story: ResolvedStory, args: Record<string, unknown>): string {
  const componentName = story.meta.component?.displayName ?? story.meta.component?.name ?? story.componentName
  const mergedArgs = { ...story.meta.args, ...story.story.args, ...args }
  const propsStr = argsToJSXString(mergedArgs)

  if (!propsStr) return `<${componentName} />`
  return `<${componentName}\n${propsStr}\n/>`
}

function addLineNumbers(code: string): Array<{ number: number; content: string }> {
  return code.split('\n').map((line, i) => ({ number: i + 1, content: line }))
}

export function CodeViewer({ story, args }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)

  if (!story) {
    return (
      <div className={styles.empty}>
        <p>Select a story to see the code</p>
      </div>
    )
  }

  const usageCode = generateUsageSnippet(story, args)

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = addLineNumbers(usageCode)
  const escaped = usageCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const highlighted = highlight(escaped)
  const highlightedLines = highlighted.split('\n')

  return (
    <div className={styles.viewer}>
      {/* Usage snippet */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Usage</span>
          <button
            className={styles.copyBtn}
            onClick={() => copy(usageCode)}
            title="Copy code"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className={styles.codeBlock}>
          <div className={styles.lineNumbers} aria-hidden>
            {lines.map(l => (
              <span key={l.number} className={styles.lineNumber}>{l.number}</span>
            ))}
          </div>
          <pre className={styles.code}>
            {highlightedLines.map((line, i) => (
              <div
                key={i}
                className={styles.codeLine}
                dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
              />
            ))}
          </pre>
        </div>
      </div>

      {/* Story args as JSON */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Args</span>
        </div>
        <div className={styles.codeBlock}>
          <pre className={styles.code}>
            <code className={styles.json}>
              {JSON.stringify({ ...story.meta.args, ...story.story.args, ...args }, null, 2)}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}
