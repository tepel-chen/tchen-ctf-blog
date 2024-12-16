import MarkdownIt from "markdown-it";
import { mdRendererFence } from "./md/md-renderer-fence";
import mdContainer from "markdown-it-container";
import mdnh from 'markdown-it-anchor';
import type Token from "markdown-it/lib/token.mjs";
import markdownItLatex from 'markdown-it-latex';
import { parseToc } from "./toc";
const md = MarkdownIt({
  breaks: true,
  linkify: true,
  html: true,
});

const containerDetailsOptions = {
  validate: function (params: string) {
    return /^details\s+(.*)$/.test(params.trim());
  },
  render: function (tokens: Token[], idx: number) {
    const m = tokens[idx].info.trim().match(/^details\s+(.*)$/);
    const summary = m?.[1] || "";
    if (tokens[idx].nesting === 1) {
      // opening tag
      return (
        "<details><summary>" +
        summary +
        '</summary><div class="details-content">'
      );
    } else {
      // closing tag
      return "</div></details>\n";
    }
  },
};

const msgClassRegex = /^message\s*(alert)?$/;

const containerMessageOptions = {
  validate: function (params: string) {
    return msgClassRegex.test(params.trim());
  },
  render: function (tokens: Token[], idx: number) {
    const m = tokens[idx].info.trim().match(msgClassRegex);
    const messageName = m?.[1] === "alert" ? "alert" : "message";

    if (tokens[idx].nesting === 1) {
      // opening tag
      const symbol = `<span class="msg-symbol">!</span>`;
      return `<aside class="msg ${messageName}">${symbol}<div class="msg-content">`;
    } else {
      // closing tag
      return `</div></aside>\n`;
    }
  },
};

var used_headers: Record<string, number> = {}
md.use(mdRendererFence)
  .use(markdownItLatex)
  .use(mdnh, {
    slugify: (s: string) => s.replace("✅", "").replace(/\([^()]*\)/g, "").trim()
  })
  .use(mdContainer, "details", containerDetailsOptions)
  .use(mdContainer, "message", containerMessageOptions);

export default async function markdownToHtml(markdown: string) {
  const html = md.render(markdown);
  return {
    html,
    toc: parseToc(html),
  };
}
