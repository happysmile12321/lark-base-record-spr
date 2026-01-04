// Markdown 内容样式生成器
export const getMarkdownStyles = (theme: 'light' | 'dark'): string => `
  .markdown-content {
    line-height: 1.9;
    font-size: 0.85rem;
    font-weight: 400;
  }
  .markdown-content h1,
  .markdown-content h2,
  .markdown-content h3,
  .markdown-content h4,
  .markdown-content h5,
  .markdown-content h6 {
    font-weight: 600;
    margin-top: 1.8em;
    margin-bottom: 0.6em;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }
  .markdown-content h1 {
    font-size: 1.6rem;
    padding-bottom: 0.6em;
    border-bottom: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  }
  .markdown-content h2 {
    font-size: 1.3rem;
    padding-bottom: 0.4em;
    border-bottom: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  }
  .markdown-content h3 {
    font-size: 1.15rem;
  }
  .markdown-content h4 {
    font-size: 1.05rem;
  }
  .markdown-content p {
    margin-bottom: 1em;
  }
  .markdown-content a {
    color: #6366f1;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .markdown-content ul,
  .markdown-content ol {
    margin-left: 1.5em;
    margin-bottom: 1em;
  }
  .markdown-content li {
    margin-bottom: 0.3em;
  }
  .markdown-content code {
    background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
    padding: 0.2em 0.5em;
    border-radius: 0.3em;
    font-size: 0.85em;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  }
  .markdown-content pre {
    background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
    padding: 1.2em;
    border-radius: 1rem;
    overflow-x: auto;
    margin-bottom: 1.2em;
    border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  }
  .markdown-content pre code {
    background: transparent;
    padding: 0;
  }
  .markdown-content blockquote {
    border-left: 3px solid #6366f1;
    padding-left: 1em;
    margin-left: 0;
    color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
    font-style: italic;
  }
  .markdown-content table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
  }
  .markdown-content th,
  .markdown-content td {
    border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
    padding: 0.5em;
  }
  .markdown-content th {
    background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  }
  .markdown-content img {
    max-width: 100%;
    border-radius: 1rem;
  }
  .markdown-content hr {
    border: none;
    border-top: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
    margin: 2em 0;
  }
  .markdown-paragraph {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 1rem;
    transition: all 0.2s ease;
    position: relative;
    border: 1px solid transparent;
  }
  .markdown-paragraph:hover {
    background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'};
    border-color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  }
  .markdown-paragraph.highlighted {
    background: ${theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)'};
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
  }
  .markdown-paragraph.linked {
    border-color: rgba(16, 185, 129, 0.4);
    background: ${theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)'};
  }
  .markdown-paragraph.can-link {
    cursor: pointer;
  }
`;
