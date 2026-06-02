import { prettifyMarkdown, smartTypography, copyText, downloadFile, toast, debounce, diffLines } from '../../shared/utils.js';
import { store } from '../../shared/store.js';
import { load } from '../../shared/deps.js';
import { printHtml } from '../../shared/print.js';

let ctrl = null;

const RE_HEADING       = /^(#{1,6})\s+(.+)/;
const RE_BARE_URL      = /https?:\/\/[^\s)>]+/;
const RE_LINKED_URL    = /\]\(https?:/;
const RE_TRAILING_WS   = /\s+$/;
const RE_HEADING_NOSP  = /^#{1,6}[^#\s]/;
const RE_LIST_MARKER   = /^\s*[*+]\s/;
const RE_LIST_REPLACE  = /^(\s*)[*+](\s)/;
const RE_3BLANKS       = /\n{3,}/g;

export default {
  id: 'format',
  title: 'Formatter',

  mount(container) {
    ctrl = new AbortController();
    const { signal } = ctrl;
    container.innerHTML = TEMPLATE();
    const el = s => container.querySelector(s);

    function getOptions() {
      return {
        normalize:    el('#opt-normalize').checked,
        blanks:       el('#opt-blanks').checked,
        trailing:     el('#opt-trailing').checked,
        listMarkers:  el('#opt-list').checked,
        smartTypo:    el('#opt-smarttypo').checked,
        finalNewline: el('#opt-newline').checked,
      };
    }

    function format(md, opts) {
      let out = md;
      if (opts.trailing)    out = out.split('\n').map(l => l.trimEnd()).join('\n');
      if (opts.normalize)   out = prettifyMarkdown(out);
      if (opts.blanks)      out = out.replace(RE_3BLANKS, '\n\n');
      if (opts.listMarkers) out = normalizeListMarkers(out);
      if (opts.smartTypo)   out = smartTypography(out);
      if (opts.finalNewline && !out.endsWith('\n')) out += '\n';
      return out;
    }

    function normalizeListMarkers(md) {
      return md.split('\n').map(line => {
        if (RE_LIST_MARKER.test(line)) return line.replace(RE_LIST_REPLACE, '$1-$2');
        return line;
      }).join('\n');
    }

    function lint(md) {
      const warnings = [];
      const lines = md.split('\n');
      const headings = Object.create(null);
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const hm = l.match(RE_HEADING);
        if (hm) {
          const text = hm[2].trim();
          if (headings[text]) warnings.push({ line: i+1, msg: `Duplicate heading: "${text}"` });
          headings[text] = true;
        }
        if (RE_BARE_URL.test(l) && !RE_LINKED_URL.test(l) && !l.startsWith('    ') && !l.startsWith('\t')) {
          warnings.push({ line: i+1, msg: 'Bare URL - wrap in <…> or [text](url)' });
        }
        if (RE_TRAILING_WS.test(l)) warnings.push({ line: i+1, msg: 'Trailing whitespace' });
        if (RE_HEADING_NOSP.test(l)) warnings.push({ line: i+1, msg: 'Heading missing space after #' });
      }
      return warnings;
    }

    function run() {
      const input = el('#fmt-input').value;
      const opts  = getOptions();
      const output = format(input, opts);
      el('#fmt-output').value = output;

      // Diff view
      const showDiff = el('#opt-diff').checked;
      const diffEl   = el('#fmt-diff');
      if (showDiff && input !== output) {
        diffEl.style.display = 'block';
        renderDiff(input, output, diffEl);
      } else {
        diffEl.style.display = 'none';
      }

      // Lint - style hints / warnings, not hard errors
      const warns = lint(input);
      const lintEl = el('#fmt-lint');
      if (warns.length) {
        lintEl.innerHTML =
          `<span class="badge badge-warning" style="margin:2px">${warns.length} lint hint${warns.length === 1 ? '' : 's'}</span>` +
          warns.map(w =>
            `<div class="badge badge-warning" style="margin:2px;display:inline-flex">L${w.line}: ${w.msg}</div>`
          ).join('');
      } else {
        lintEl.innerHTML = '<span class="badge badge-success">No issues found</span>';
      }
    }

    function renderDiff(a, b, container) {
      const { ops, aLines, bLines } = diffLines(a, b);
      let aNum = 0, bNum = 0;
      const html = ops.map(op => {
        if (op.type === 'eq')  { aNum++; bNum++; return `<div class="diff-line"><span class="diff-ln">${aNum}</span><span class="diff-ln">${bNum}</span><span class="diff-marker"> </span><span class="diff-text">${esc(aLines[op.a])}</span></div>`; }
        if (op.type === 'del') { aNum++; return `<div class="diff-line diff-del"><span class="diff-ln">${aNum}</span><span class="diff-ln"></span><span class="diff-marker">−</span><span class="diff-text">${esc(aLines[op.a])}</span></div>`; }
        if (op.type === 'ins') { bNum++; return `<div class="diff-line diff-add"><span class="diff-ln"></span><span class="diff-ln">${bNum}</span><span class="diff-marker">+</span><span class="diff-text">${esc(bLines[op.b])}</span></div>`; }
        return '';
      }).join('');
      container.innerHTML = `<div class="diff-output">${html}</div>`;
    }

    function esc(s='') { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // Auto-populate from shared markdown state
    const shared = store.get('currentMarkdown', '');
    if (shared && !el('#fmt-input').value) {
      el('#fmt-input').value = shared;
      run();
    }

    const schedRun = debounce(run, 250);
    el('#fmt-input').addEventListener('input', e => {
      store.set('currentMarkdown', e.target.value);
      schedRun();
    }, { signal });
    container.querySelectorAll('.fmt-opt').forEach(inp => {
      inp.addEventListener('change', run, { signal });
    });

    el('#btn-apply').addEventListener('click', () => {
      const out = el('#fmt-output').value;
      el('#fmt-input').value = out;
      run();
      toast('Applied to input');
    }, { signal });

    el('#btn-copy-fmt').addEventListener('click', async () => {
      await copyText(el('#fmt-output').value || '');
      toast('Copied!');
    }, { signal });

    el('#btn-download-fmt').addEventListener('click', () => {
      downloadFile('formatted.md', el('#fmt-output').value || '');
    }, { signal });

    el('#btn-print-fmt').addEventListener('click', async () => {
      const md = el('#fmt-output').value || '';
      if (!md) return;
      await load('marked', 'dompurify');
      printHtml(window.DOMPurify.sanitize(window.marked.parse(md)));
    }, { signal });

    el('#btn-clear-fmt').addEventListener('click', () => {
      el('#fmt-input').value = '';
      el('#fmt-output').value = '';
      el('#fmt-diff').style.display = 'none';
      el('#fmt-lint').innerHTML = '';
    }, { signal });
  },

  unmount() { ctrl?.abort(); ctrl = null; },
};

function TEMPLATE() { return `
<div class="tool-shell">
  <div class="tool-header">
    <button class="menu-btn" aria-label="Open menu"><svg class="icon"><use href="#icon-menu"/></svg></button>
    <span class="tool-title">Formatter</span>
    <span class="tool-desc">Normalize &amp; lint Markdown</span>
    <div class="header-spacer"></div>
    <div class="tool-actions">
      <button class="btn btn-secondary btn-sm" id="btn-apply" title="Copy formatted back to input">Apply to Input</button>
      <button class="btn btn-secondary btn-sm" id="btn-clear-fmt">Clear</button>
      <button class="btn btn-secondary btn-sm" id="btn-download-fmt" title="Download"><svg class="icon"><use href="#icon-download"/></svg></button>
      <button class="btn btn-secondary btn-sm" id="btn-print-fmt" title="Print / Save as PDF"><svg class="icon"><use href="#icon-print"/></svg></button>
      <button class="btn btn-primary btn-sm" id="btn-copy-fmt"><svg class="icon"><use href="#icon-copy"/></svg> Copy</button>
    </div>
  </div>
  <div class="tool-body flex-col">
    <!-- Options -->
    <div class="tool-bar">
      <label class="checkbox-wrap"><input type="checkbox" class="fmt-opt" id="opt-normalize" checked> Normalize headings</label>
      <label class="checkbox-wrap"><input type="checkbox" class="fmt-opt" id="opt-blanks" checked> Collapse blank lines</label>
      <label class="checkbox-wrap"><input type="checkbox" class="fmt-opt" id="opt-trailing" checked> Trim trailing spaces</label>
      <label class="checkbox-wrap"><input type="checkbox" class="fmt-opt" id="opt-list"> Normalize list markers</label>
      <label class="checkbox-wrap"><input type="checkbox" class="fmt-opt" id="opt-smarttypo"> ASCII quotes/dashes</label>
      <label class="checkbox-wrap"><input type="checkbox" class="fmt-opt" id="opt-newline" checked> Ensure final newline</label>
      <label class="checkbox-wrap"><input type="checkbox" class="fmt-opt" id="opt-diff"> Show diff</label>
    </div>
    <!-- Lint bar -->
    <div id="fmt-lint" class="lint-bar"></div>
    <!-- Editors -->
    <div class="split-2 fill" style="border-top:2px solid var(--border-strong)">
      <div class="panel panel-editor">
        <div class="panel-header"><span class="panel-label">Input</span></div>
        <textarea id="fmt-input" class="code-editor" spellcheck="false" placeholder="Paste markdown to format…" aria-label="Markdown input"></textarea>
      </div>
      <div class="split-handle" data-dir="h"></div>
      <div class="panel panel-preview">
        <div class="panel-header"><span class="panel-label">Formatted</span></div>
        <textarea id="fmt-output" class="code-editor" spellcheck="false" readonly aria-label="Formatted output"></textarea>
        <div id="fmt-diff" class="scroll-region" style="display:none;border-top:1px solid var(--border);max-height:240px;overflow:auto"></div>
      </div>
    </div>
  </div>
</div>`; }
