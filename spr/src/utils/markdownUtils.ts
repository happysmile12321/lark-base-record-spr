/**
 * Markdown 处理工具函数
 */
export const markdownUtils = {
  /**
   * 将 Markdown 文本按空行分割为段落
   */
  splitToParagraphs(markdown: string): string[] {
    if (!markdown) return [];

    const lines = markdown.split('\n');
    const paragraphs: string[] = [];
    let currentPara = '';

    for (const line of lines) {
      if (line.trim() === '') {
        if (currentPara.trim()) {
          paragraphs.push(currentPara.trim());
          currentPara = '';
        }
      } else {
        currentPara += (currentPara ? '\n' : '') + line;
      }
    }

    if (currentPara.trim()) {
      paragraphs.push(currentPara.trim());
    }

    return paragraphs;
  },

  /**
   * 生成 CSS 样式字符串
   */
  generateStyles(theme: 'light' | 'dark'): string {
    const borderColor = theme === 'dark' ? '#334155' : '#e2e8f0';
    const codeBg = theme === 'dark' ? '#1e293b' : '#f1f5f9';
    const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    const linkColor = '#6366f1';
    const highlightBg = theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)';
    const linkBg = theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)';
    const linkBorder = '#10b981';

    return `
      .markdown-content {
        line-height: 1.8;
        font-size: 0.875rem;
      }
      .markdown-content h1,
      .markdown-content h2,
      .markdown-content h3,
      .markdown-content h4,
      .markdown-content h5,
      .markdown-content h6 {
        font-weight: 700;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        line-height: 1.3;
      }
      .markdown-content h1 {
        font-size: 1.5rem;
        border-bottom: 1px solid ${borderColor};
        padding-bottom: 0.5em;
      }
      .markdown-content h2 {
        font-size: 1.25rem;
        border-bottom: 1px solid ${borderColor};
        padding-bottom: 0.3em;
      }
      .markdown-content h3 {
        font-size: 1.1rem;
      }
      .markdown-content h4 {
        font-size: 1rem;
      }
      .markdown-content p {
        margin-bottom: 1em;
      }
      .markdown-content a {
        color: ${linkColor};
        text-decoration: underline;
      }
      .markdown-content ul,
      .markdown-content ol {
        margin-left: 1.5em;
        margin-bottom: 1em;
      }
      .markdown-content li {
        margin-bottom: 0.25em;
      }
      .markdown-content code {
        background: ${codeBg};
        padding: 0.2em 0.4em;
        border-radius: 0.25em;
        font-size: 0.85em;
      }
      .markdown-content pre {
        background: ${codeBg};
        padding: 1em;
        border-radius: 0.5em;
        overflow-x: auto;
        margin-bottom: 1em;
      }
      .markdown-content pre code {
        background: transparent;
        padding: 0;
      }
      .markdown-content blockquote {
        border-left: 4px solid ${linkColor};
        padding-left: 1em;
        margin-left: 0;
        color: ${textColor};
        font-style: italic;
      }
      .markdown-content table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1em;
      }
      .markdown-content th,
      .markdown-content td {
        border: 1px solid ${borderColor};
        padding: 0.5em;
      }
      .markdown-content th {
        background: ${codeBg};
      }
      .markdown-content img {
        max-width: 100%;
        border-radius: 0.5em;
      }
      .markdown-content hr {
        border: none;
        border-top: 1px solid ${borderColor};
        margin: 1.5em 0;
      }
      .markdown-paragraph {
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        border-radius: 0.5rem;
        transition: all 0.2s;
        position: relative;
      }
      .markdown-paragraph:hover {
        background: ${theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'};
      }
      .markdown-paragraph.highlighted {
        background: ${highlightBg};
        border-left: 3px solid ${linkColor};
      }
      .markdown-paragraph.linked {
        border: 1px solid ${linkBorder};
        background: ${linkBg};
      }
      .markdown-paragraph.can-link {
        cursor: pointer;
      }
      .markdown-paragraph.can-link::after {
        content: '🔗';
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s;
        font-size: 0.75rem;
      }
      .markdown-paragraph.can-link:hover::after {
        opacity: 1;
      }
    `;
  },

  /**
   * 计算滚动位置（考虑头部偏移）
   */
  calculateScrollPosition(elementTop: number, offset: number = 20): number {
    return elementTop - offset;
  }
};
