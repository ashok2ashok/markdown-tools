import { store } from '../../shared/store.js';
import { debounce, copyText, downloadFile, toast } from '../../shared/utils.js';
import { printHtml } from '../../shared/print.js';
import { load } from '../../shared/deps.js';

// Adapter registry - lazy import to avoid loading CDN deps until selected
const ADAPTERS = new Map([
  ['textarea', () => import('./adapters/textarea.js')],
  ['easymde',  () => import('./adapters/easymde.js')],
  ['toastui',  () => import('./adapters/toastui.js')],
]);

const META = [
  { id: 'textarea', label: 'Plain (textarea)', size: '0 KB' },
  { id: 'easymde',  label: 'EasyMDE',           size: '~200 KB' },
  { id: 'toastui',  label: 'Toast UI (WYSIWYG)', size: '~500 KB' },
];

let ctrl = null;
let activeAdapter = null;
let activeInstance = null;
let currentMd = '';
let switchGen = 0; // race guard: each switchTo bumps this; only latest wins

export default {
  id: 'editor',
  title: 'Editor',

  async mount(container) {
    ctrl = new AbortController();
    const { signal } = ctrl;

    currentMd = store.get('currentMarkdown', '');
    const startId = store.get('editor', 'textarea');

    container.innerHTML = TEMPLATE(startId);
    const el = s => container.querySelector(s);

    const editorHost = el('#editor-host');
    const statusEl   = el('#editor-status');

    const onChange = debounce(md => {
      currentMd = md;
      store.set('currentMarkdown', md);
      statusEl.textContent = `${md.length.toLocaleString()} chars · auto-saved`;
    }, 300);

    async function switchTo(id) {
      if (!ADAPTERS.has(id)) id = 'textarea';
      const gen = ++switchGen;

      // Persist value from current editor before swap
      if (activeAdapter && activeInstance) {
        try { currentMd = activeAdapter.getValue(activeInstance) ?? currentMd; } catch {}
        try { activeAdapter.destroy(activeInstance); } catch {}
        activeAdapter = null;
        activeInstance = null;
      }

      statusEl.textContent = `Loading ${id}…`;
      editorHost.innerHTML = '<div class="editor-loading"><div class="spinner"></div></div>';

      try {
        const mod = await ADAPTERS.get(id)();
        if (gen !== switchGen) return; // superseded
        const adapter = mod.default;
        await adapter.load();
        if (gen !== switchGen) return; // superseded
        const inst = await adapter.mount(editorHost, currentMd, onChange);
        if (gen !== switchGen) {
          // superseded after mount - clean up the orphan
          try { adapter.destroy(inst); } catch {}
          return;
        }
        activeInstance = inst;
        activeAdapter = adapter;
        store.set('editor', id);
        statusEl.textContent = `${adapter.label} ready`;
        container.querySelectorAll('.editor-pick').forEach(b => {
          b.classList.toggle('active', b.dataset.editor === id);
          b.setAttribute('aria-pressed', b.dataset.editor === id ? 'true' : 'false');
        });
      } catch (err) {
        if (gen !== switchGen) return;
        console.error('[editor] load failed:', err);
        statusEl.textContent = `Failed to load ${id} - falling back to plain`;
        if (id !== 'textarea') switchTo('textarea');
      }
    }

    // Switcher buttons
    container.querySelectorAll('.editor-pick').forEach(btn => {
      btn.addEventListener('click', () => switchTo(btn.dataset.editor), { signal });
    });

    // Actions
    el('#btn-editor-copy').addEventListener('click', async () => {
      const md = activeAdapter?.getValue(activeInstance) ?? currentMd;
      if (!md) return;
      await copyText(md);
      toast('Copied!');
    }, { signal });

    el('#btn-editor-download').addEventListener('click', () => {
      const md = activeAdapter?.getValue(activeInstance) ?? currentMd;
      if (!md) return;
      downloadFile('document.md', md);
    }, { signal });

    el('#btn-editor-print').addEventListener('click', async () => {
      const md = activeAdapter?.getValue(activeInstance) ?? currentMd;
      if (!md) return;
      await load('marked', 'dompurify');
      printHtml(window.DOMPurify.sanitize(window.marked.parse(md)));
    }, { signal });

    el('#btn-editor-clear').addEventListener('click', () => {
      currentMd = '';
      if (activeAdapter && activeInstance) activeAdapter.setValue(activeInstance, '');
      store.set('currentMarkdown', '');
      statusEl.textContent = 'Cleared';
    }, { signal });

    // Init: load saved editor
    switchTo(startId);
  },

  unmount() {
    ctrl?.abort();
    ctrl = null;
    switchGen++; // cancel any in-flight switchTo
    if (activeAdapter && activeInstance) {
      try { currentMd = activeAdapter.getValue(activeInstance) ?? currentMd; } catch {}
      try { activeAdapter.destroy(activeInstance); } catch {}
    }
    activeAdapter = null;
    activeInstance = null;
    // Persist final value so other tools see it
    if (currentMd) store.set('currentMarkdown', currentMd);
  },
};

function TEMPLATE(activeId) {
  const picks = META.map(m =>
    `<button class="seg-btn editor-pick${m.id === activeId ? ' active' : ''}" data-editor="${m.id}" aria-pressed="${m.id === activeId ? 'true' : 'false'}" title="${m.size}">${m.label}</button>`
  ).join('');

  return `
<div class="tool-shell">
  <div class="tool-header">
    <button class="menu-btn" aria-label="Open menu"><svg class="icon"><use href="#icon-menu"/></svg></button>
    <span class="tool-title">Editor</span>
    <span class="tool-desc">Switch between markdown editors</span>
    <div class="header-spacer"></div>
    <div class="tool-actions">
      <button class="btn btn-secondary btn-sm" id="btn-editor-clear">Clear</button>
      <button class="btn btn-secondary btn-sm" id="btn-editor-print" title="Print / Save as PDF"><svg class="icon"><use href="#icon-print"/></svg></button>
      <button class="btn btn-secondary btn-sm" id="btn-editor-download" title="Download .md"><svg class="icon"><use href="#icon-download"/></svg></button>
      <button class="btn btn-primary btn-sm" id="btn-editor-copy"><svg class="icon"><use href="#icon-copy"/></svg> Copy</button>
    </div>
  </div>
  <div class="tool-bar">
    <span class="label" style="margin:0">Editor:</span>
    <div class="seg-ctrl" role="group" aria-label="Editor choice">
      ${picks}
    </div>
    <span class="text-xs text-muted" style="margin-left:auto" id="editor-status">Loading…</span>
  </div>
  <div class="tool-body flex-col">
    <div id="editor-host" class="editor-host" style="flex:1;min-height:0;display:flex;flex-direction:column"></div>
  </div>
</div>`;
}
