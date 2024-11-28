import MarkdownIt from 'markdown-it';
import { highlight } from './highlight';
/*
 * ref: https://github.com/zenn-dev/zenn-editor/blob/canary/packages/zenn-markdown-html/src/utils/md-renderer-fence.ts
 */

function getHtml({
  content,
  className,
  fileName,
  line,
}: {
  content: string;
  className: string;
  fileName?: string;
  line?: number;
}) {

  return `<div class="code-block-container">${
    fileName
      ? `<div class="code-block-filename-container"><span class="code-block-filename">${fileName}</span></div>`
      : ''
  }<pre class="${className}"><code class="${
    className !== '' ? `${className} code-line` : 'code-line'
  }" ${
    line !== undefined ? `data-line="${line}"` : ''
  }>${content}</code></pre></div>`;
}

function getClassName({
  langName = '',
  hasDiff,
}: {
  hasDiff: boolean;
  langName?: string;
}): string {
  const isSafe = /^[\w-]{0,30}$/.test(langName);
  if (!isSafe) return '';

  if (hasDiff) {
    return `diff-highlight ${
      langName.length ? `language-diff-${langName}` : ''
    }`;
  }
  return langName ? `language-${langName}` : '';
}

const fallbackLanguages: {
  [key: string]: string;
} = {
  vue: 'html',
  react: 'jsx',
  fish: 'shell',
  sh: 'shell',
  cwl: 'yaml',
  tf: 'hcl', // ref: https://github.com/PrismJS/prism/issues/1252
};

function normalizeLangName(str?: string): string {
  if (!str?.length) return '';
  const langName = str.toLocaleLowerCase();
  return fallbackLanguages[langName] ?? langName;
}

export function parseInfo(str: string): {
  hasDiff: boolean;
  langName: string;
  fileName?: string;
} {
  if (str.trim() === '') {
    return {
      langName: 'text',
      fileName: undefined,
      hasDiff: false,
    };
  }

  // e.g. foo:filename => ["foo", "filename"]
  // e.g. foo diff:filename => ["foo diff", "filename"]
  let [langInfo, fileName] = str.split(':');
  if(!fileName && langInfo) {
    fileName = langInfo;
    const spltted = fileName.split('.');
    langInfo = spltted[spltted.length - 1];
    if(langInfo === fileName) fileName = ''
  }

  const langNames = langInfo.split(' ');
  const hasDiff = langNames.some((name) => name === 'diff');

  const langName: undefined | string = hasDiff
    ? langNames.find((lang) => lang !== 'diff')
    : langNames[0];

  return {
    langName: normalizeLangName(langName),
    fileName,
    hasDiff,
  };
}

export function mdRendererFence(md: MarkdownIt) {
  // override fence
  md.renderer.rules.fence = function (...args) {
    const [tokens, idx] = args;
    const { info, content } = tokens[idx];
    const { langName, fileName, hasDiff } = parseInfo(info);

    const className = getClassName({
      langName,
      hasDiff,
    });
    const highlightedContent = highlight(content, langName, hasDiff);
    const fenceStart = tokens[idx].map?.[0];

    return getHtml({
      content: highlightedContent,
      className,
      fileName,
      line: fenceStart,
    });
  };
}