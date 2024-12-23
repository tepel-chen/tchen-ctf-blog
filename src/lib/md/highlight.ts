import Prism, { Grammar } from 'prismjs';
import { enableDiffHighlight } from '../prism/prism-diff-highlight';
import "prismjs/themes/prism-okaidia.css";
import "prismjs/components/prism-python.min.js";
import "prismjs/components/prism-sql.min.js";
import "prismjs/components/prism-markup-templating.min.js";
import "prismjs/components/prism-php.min.js";
import "prismjs/components/prism-java.min.js";
import "prismjs/components/prism-docker.min.js";
import "prismjs/components/prism-nginx.min.js";
import "prismjs/components/prism-c.min.js";
import "prismjs/components/prism-ejs.min.js";
import "prismjs/components/prism-css.min.js";
import "prismjs/components/prism-diff.min.js";


/*
 * ref: https://github.com/zenn-dev/zenn-editor/blob/canary/packages/zenn-markdown-html/src/utils/highlight.ts
 */

// diffプラグインを有効化
enableDiffHighlight();

function highlightContent({
  text,
  prismGrammar,
  langName,
  hasDiff,
}: {
  text: string;
  prismGrammar?: Grammar;
  langName?: string;
  hasDiff: boolean;
}): string {
  if (prismGrammar && langName) {
    if (hasDiff)
      return Prism.highlight(text, Prism.languages.diff, `diff-${langName}`);
    
    return Prism.highlight(text, prismGrammar, langName);
  }

  if (hasDiff) return Prism.highlight(text, Prism.languages.diff, 'diff');
  return text;
}

export function highlight(
  text: string,
  langName: string,
  hasDiff: boolean
): string {
  const prismGrammar = Prism.languages[langName];
  if(!prismGrammar) {
    console.warn(`undefined language: ${langName}`)
  }
  return highlightContent({ text, prismGrammar, langName, hasDiff });
}