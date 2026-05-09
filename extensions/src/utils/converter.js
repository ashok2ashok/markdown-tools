import TurndownService from 'turndown';
import * as turndownPluginGfm from 'turndown-plugin-gfm';
import { tableToMarkdown, prettifyMarkdown, smartTypography } from '../../../shared/utils.js';

const { strikethrough, taskListItems } = turndownPluginGfm;

const FLAVORS = {
  gfm:           { strikethrough: true,  taskLists: true,  keepTableHtml: false },
  commonmark:    { strikethrough: false, taskLists: false, keepTableHtml: true  },
  pandoc:        { strikethrough: true,  taskLists: false, keepTableHtml: false },
  rmarkdown:     { strikethrough: true,  taskLists: false, keepTableHtml: false },
  multimarkdown: { strikethrough: false, taskLists: false, keepTableHtml: false },
};

function buildTurndown(flavor) {
  const f = FLAVORS[flavor] || FLAVORS.gfm;
  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  });
  if (f.strikethrough) td.use(strikethrough);
  if (f.taskLists)     td.use(taskListItems);
  if (f.keepTableHtml) td.keep(['table']);
  td.addRule('sup', { filter: 'sup', replacement: c => `^${c}^` });
  td.addRule('sub', { filter: 'sub', replacement: c => `~${c}~` });
  return td;
}

export function htmlToMarkdown(html, options = {}) {
  const { flavor = 'gfm', smartTypo = false, prettify = true } = options;
  const f = FLAVORS[flavor] || FLAVORS.gfm;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Pre-extract tables (mirrors paste tool logic in tools/paste/index.js)
  const tableMds = [];
  if (!f.keepTableHtml) {
    doc.querySelectorAll('table').forEach((table, i) => {
      tableMds.push(tableToMarkdown(table));
      const ph = doc.createElement('p');
      ph.textContent = `XXTBL${i}XX`;
      table.parentNode.replaceChild(ph, table);
    });
  }

  const td = buildTurndown(flavor);
  let md = td.turndown(doc.body.innerHTML);

  // Re-inject table markdown
  tableMds.forEach((tmd, i) => {
    md = md.replace(`XXTBL${i}XX`, tmd);
  });

  if (smartTypo) md = smartTypography(md);
  if (prettify)  md = prettifyMarkdown(md);

  return md;
}

export { tableToMarkdown };
