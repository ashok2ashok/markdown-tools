import { extractHeadings, copyText, downloadFile, toast, debounce } from '../../shared/utils.js';
import { store } from '../../shared/store.js';

let ctrl = null;

export default {
  id: 'toc',
  title: 'TOC Generator',

  mount(container) {
    ctrl = new AbortController();
    const { signal } = ctrl;
    container.innerHTML = TEMPLATE();
    const el = s => container.querySelector(s);

    function generate() {
      const md = el('#toc-input').value.trim();
      const minDepth = +el('#toc-min').value || 1;
      const maxDepth = +el('#toc-max').value || 6;
      const indent   = el('#toc-indent').value === 'tab' ? '\t' : '  ';
      const links    = el('#toc-links').checked;
      const numbered = el('#toc-numbered').checked;

      const headings = extractHeadings(md).filter(h => h.level >= minDepth && h.level <= maxDepth);
      if (!headings.length) { el('#toc-output').value = ''; renderPreview(''); return; }

      const minLevel = Math.min(...headings.map(h => h.level));
      const counters = {};
      const tocLines = headings.map(h => {
        const depth = h.level - minLevel;
        const pad = indent.repeat(depth);
        let marker = '- ';
        if (numbered) {
          const lvl = h.level;
          counters[lvl] = (counters[lvl] || 0) + 1;
          // reset deeper levels
          for (const k of Object.keys(counters)) { if (+k > lvl) delete counters[+k]; }
          marker = counters[lvl] + '. ';
        }
        const text = links ? `[${h.text}](#${h.slug})` : h.text;
        return pad + marker + text;
      });

      const toc = tocLines.join('\n');
      el('#toc-output').value = toc;
      renderPreview(toc);
      el('#toc-count').textContent = headings.length + ' headings';
    }

    function renderPreview(toc) {
      // Simple visual preview as nested list
      const lines = toc.split('\n');
      const items = lines.map(l => {
        const depth = (l.match(/^(\s+)/)?.[1].length || 0) / 2;
        const text = l.replace(/^[\s\-*\d.]+/, '').trim();
        return `<div style="padding-left:${depth*16}px;font-size:var(--text-sm);padding-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${depth===0?'var(--text)':'var(--text-muted)'}">${text}</div>`;
      }).join('');
      el('#toc-preview').innerHTML = items || '<p class="text-muted text-xs">TOC will appear here</p>';
    }

    const schedGen = debounce(generate, 300);

    // Auto-populate from shared markdown state
    const shared = store.get('currentMarkdown', '');
    if (shared && !el('#toc-input').value) {
      el('#toc-input').value = shared;
      generate();
    }

    el('#toc-input').addEventListener('input', e => {
      store.set('currentMarkdown', e.target.value);
      schedGen();
    }, { signal });
    ['#toc-min','#toc-max','#toc-indent'].forEach(s => {
      el(s)?.addEventListener('change', generate, { signal });
    });
    ['#toc-links','#toc-numbered'].forEach(s => {
      el(s)?.addEventListener('change', generate, { signal });
    });

    el('#btn-copy-toc').addEventListener('click', async () => {
      const v = el('#toc-output').value;
      if (!v) return;
      await copyText(v);
      toast('Copied!');
    }, { signal });

    el('#btn-download-toc').addEventListener('click', () => {
      const v = el('#toc-output').value;
      if (v) downloadFile('toc.md', v);
    }, { signal });

    el('#btn-insert-toc').addEventListener('click', () => {
      const toc = el('#toc-output').value;
      const md  = el('#toc-input').value;
      if (!toc || !md) return;
      let result;
      // Replace <!-- toc --> block if exists
      if (md.includes('<!-- toc -->')) {
        result = md.replace(/<!-- toc -->[\s\S]*?<!-- \/toc -->/,`<!-- toc -->\n${toc}\n<!-- /toc -->`);
        if (!result.includes('<!-- toc -->')) result = result.replace('<!-- toc -->', `<!-- toc -->\n${toc}\n<!-- /toc -->`);
      } else {
        // Insert after first H1
        const h1Match = md.match(/^# .+$/m);
        if (h1Match) {
          const idx = md.indexOf(h1Match[0]) + h1Match[0].length;
          result = md.slice(0,idx) + '\n\n<!-- toc -->\n' + toc + '\n<!-- /toc -->' + md.slice(idx);
        } else {
          result = `<!-- toc -->\n${toc}\n<!-- /toc -->\n\n` + md;
        }
      }
      el('#toc-input').value = result;
      generate();
      toast('TOC inserted into source');
    }, { signal });
  },

  unmount() { ctrl?.abort(); ctrl = null; },
};

function TEMPLATE() { return `
<div class="tool-shell">
  <div class="tool-header">
    <button class="menu-btn" aria-label="Open menu"><svg class="icon"><use href="#icon-menu"/></svg></button>
    <span class="tool-title">TOC Generator</span>
    <span class="tool-desc">Extract headings → table of contents</span>
    <div class="header-spacer"></div>
    <div class="tool-actions">
      <span id="toc-count" class="badge"></span>
      <button class="btn btn-secondary btn-sm" id="btn-insert-toc" title="Insert after first H1">Insert into Source</button>
      <button class="btn btn-secondary btn-sm" id="btn-download-toc"><svg class="icon"><use href="#icon-download"/></svg></button>
      <button class="btn btn-primary btn-sm" id="btn-copy-toc"><svg class="icon"><use href="#icon-copy"/></svg> Copy</button>
    </div>
  </div>
  <!-- Options bar — full width, above the split -->
  <div class="tool-bar">
    <span class="panel-label" style="flex:none">Depth</span>
    <select id="toc-min" class="select" style="width:60px" aria-label="Min heading level">
      <option value="1" selected>H1</option><option value="2">H2</option><option value="3">H3</option>
    </select>
    <span class="text-muted text-xs">–</span>
    <select id="toc-max" class="select" style="width:60px" aria-label="Max heading level">
      <option value="3">H3</option><option value="4">H4</option><option value="5">H5</option><option value="6" selected>H6</option>
    </select>
    <div style="width:1px;height:16px;background:var(--border);margin:0 var(--sp-1)"></div>
    <label class="checkbox-wrap"><input type="checkbox" id="toc-links" checked> Links</label>
    <label class="checkbox-wrap"><input type="checkbox" id="toc-numbered"> Numbered</label>
    <div style="width:1px;height:16px;background:var(--border);margin:0 var(--sp-1)"></div>
    <span class="panel-label" style="flex:none">Indent</span>
    <select id="toc-indent" class="select" style="width:80px" aria-label="Indent style">
      <option value="spaces">Spaces</option><option value="tab">Tab</option>
    </select>
  </div>
  <div class="tool-body split-2">
    <!-- Input -->
    <div class="panel panel-editor">
      <div class="panel-header"><span class="panel-label">Markdown Source</span></div>
      <textarea id="toc-input" class="code-editor" spellcheck="false" placeholder="Paste your markdown here…" aria-label="Markdown source"></textarea>
    </div>
    <!-- Horizontal handle -->
    <div class="split-handle" data-dir="h"></div>
    <!-- Output — vertical split: TOC text on top, visual preview below -->
    <div class="panel panel-preview">
      <div class="panel-header"><span class="panel-label">Generated TOC</span></div>
      <textarea id="toc-output" class="code-editor" spellcheck="false" readonly aria-label="Generated table of contents"></textarea>
      <div class="split-handle" data-dir="v"></div>
      <div id="toc-preview" class="scroll-region" style="padding:var(--sp-3) var(--sp-4)">
        <p class="text-muted text-xs">TOC will appear here</p>
      </div>
    </div>
  </div>
</div>`; }
