import type { ResolvedStory } from '../types/story'
import styles from './DocsPanel.module.css'

interface DocsPanelProps {
  story: ResolvedStory | undefined
}

// Minimal markdown renderer — no external parser
function renderMarkdown(md: string): string {
  let html = md
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold, italic, code span
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')

  // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Code blocks (fenced)
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

  // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)(\s*<li>)/g, '$1$2')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Horizontal rule
    .replace(/^---$/gm, '<hr>')

  // Paragraphs (lines separated by blank lines)
    .replace(/\n\n([^<])/g, '\n\n<p>')
    .replace(/([^>])\n\n/g, '$1</p>\n\n')

  // Line breaks
    .replace(/\n/g, '<br>')

  // Clean up double <br> inside block elements
    .replace(/(<(?:h[1-6]|li|pre|blockquote)[^>]*>.*?)<br>/g, '$1')

  return html
}

export function DocsPanel({ story }: DocsPanelProps) {
  if (!story) {
    return (
      <div className={styles.empty}>
        <p>Select a story to see documentation</p>
      </div>
    )
  }

  const docs = story.meta.parameters?.docs
  const componentName = story.meta.component?.displayName ?? story.meta.component?.name ?? story.componentName

  return (
    <div className={styles.docs}>
      <div className={styles.header}>
        <h1 className={styles.componentTitle}>{componentName}</h1>
        {story.meta.title && (
          <p className={styles.path}>{story.meta.title}</p>
        )}
      </div>

      {docs ? (
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(String(docs)) }}
        />
      ) : (
        <div className={styles.noDocsMessage}>
          <div className={styles.noDocsIcon}>📄</div>
          <p className={styles.noDocsTitle}>No documentation</p>
          <p className={styles.noDocsText}>
            Add a <code>parameters.docs</code> string to your story's{' '}
            <code>meta</code> object to document this component.
          </p>
          <pre className={styles.noDocsExample}>{`const meta: Meta<typeof ${componentName}> = {
  title: '${story.meta.title}',
  component: ${componentName},
  parameters: {
    docs: \`
# ${componentName}

Describe your component here using **Markdown**.
    \`
  }
}`}</pre>
        </div>
      )}
    </div>
  )
}
