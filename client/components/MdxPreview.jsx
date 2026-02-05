import React, { useMemo } from 'react';

/**
 * MDX Preview component.
 * Renders a live preview of MDX content using simple markdown-to-HTML conversion.
 * For full MDX support (JSX components, imports), this could be extended with
 * @mdx-js/mdx runtime compilation, but for the preview we use a lightweight
 * markdown renderer that handles the most common patterns.
 */
export default function MdxPreview({ content }) {
  const html = useMemo(() => renderMarkdown(content || ''), [content]);

  return (
    <div style={styles.preview}>
      <div
        style={styles.content}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function renderMarkdown(md) {
  let html = escapeHtml(md);

  // Code blocks (```lang\n...\n```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold / italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Blockquotes
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr/>');

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%"/>');

  // Paragraphs (blank line separated)
  html = html.replace(/\n\n+/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Cleanup empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr\/>)/g, '$1');

  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const styles = {
  preview: {
    fontFamily: 'var(--font-ui)',
    lineHeight: 1.7,
    color: 'var(--text-primary)',
  },
  content: {},
};

// Inject preview styles via a <style> element
if (typeof document !== 'undefined') {
  const styleId = 'mdx-preview-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .mdx-preview h1, .mdx-preview h2, .mdx-preview h3,
      .mdx-preview h4, .mdx-preview h5, .mdx-preview h6 {
        color: var(--text-active);
        margin: 1.2em 0 0.6em 0;
        line-height: 1.3;
      }
      .mdx-preview h1 { font-size: 2em; font-weight: 600; border-bottom: 1px solid var(--border-primary); padding-bottom: 0.3em; }
      .mdx-preview h2 { font-size: 1.5em; font-weight: 600; border-bottom: 1px solid var(--border-primary); padding-bottom: 0.3em; }
      .mdx-preview h3 { font-size: 1.25em; font-weight: 600; }
      .mdx-preview h4 { font-size: 1em; font-weight: 600; }

      .mdx-preview p { margin: 0.8em 0; }

      .mdx-preview a { color: var(--text-link); }
      .mdx-preview a:hover { text-decoration: underline; }

      .mdx-preview strong { color: var(--text-active); font-weight: 600; }

      .mdx-preview blockquote {
        border-left: 3px solid var(--accent-primary);
        padding: 4px 16px;
        margin: 1em 0;
        color: var(--text-secondary);
        background: rgba(0,122,204,0.05);
      }

      .mdx-preview ul, .mdx-preview ol {
        padding-left: 1.5em;
        margin: 0.8em 0;
      }

      .mdx-preview li {
        margin: 0.3em 0;
      }

      .mdx-preview hr {
        border: none;
        border-top: 1px solid var(--border-primary);
        margin: 1.5em 0;
      }

      .mdx-preview pre.code-block {
        background: #1a1a1a;
        border: 1px solid var(--border-primary);
        border-radius: 4px;
        padding: 16px;
        overflow-x: auto;
        margin: 1em 0;
        font-family: var(--font-mono);
        font-size: 13px;
        line-height: 1.5;
      }

      .mdx-preview code.inline-code {
        background: rgba(110,118,129,0.2);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: var(--font-mono);
        font-size: 0.9em;
        color: var(--accent-success);
      }

      .mdx-preview del {
        color: var(--text-muted);
      }

      .mdx-preview img {
        border-radius: 4px;
        margin: 1em 0;
      }
    `;
    document.head.appendChild(style);
  }
}
