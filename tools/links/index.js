import { extractLinks, copyText, downloadFile, toast, debounce, sanitizeUrl } from '../../shared/utils.js';
import { store } from '../../shared/store.js';

let ctrl = null;

export default {
  id: 'links',
  title: 'Link Auditor',

  mount(container) {
    ctrl = new AbortController();
    const { signal } = ctrl;
    container.innerHTML = TEMPLATE();
    const el = s => container.querySelector(s);

    let allLinks = [];
    let filter = 'all'; // 'all' | 'inline' | 'reference' | 'image'

    function extract() {
      const md = el('#links-input').value;
      allLinks = extractLinks(md);
      el('#links-count').textContent = allLinks.length ? `${allLinks.length} links` : '';
      renderTable();
    }

    function renderTable() {
      const filtered = filter === 'all' ? allLinks : allLinks.filter(l => l.type === filter);
      const tbody = el('#links-tbody');

      if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:var(--sp-6);color:var(--text-muted)">
          ${allLinks.length ? 'No links match filter.' : 'No links found. Paste markdown above.'}
        </td></tr>`;
        return;
      }

      currentFiltered = filtered;
      tbody.innerHTML = filtered.map((link, i) => {
        const typeLabel = TYPE_LABEL[link.type] || link.type;
        const typeBadge = `<span class="badge" style="background:${typeBg(link.type)};color:#fff;white-space:nowrap">${typeLabel}</span>`;
        const safeUrl = sanitizeUrl(link.url);
        const urlDisplay = safeUrl
          ? `<a href="${escAttr(safeUrl)}" target="_blank" rel="noopener noreferrer" class="link-url" title="${escAttr(safeUrl)}">${esc(truncate(safeUrl, 70))}</a>`
          : `<span class="text-muted" title="Blocked unsafe URL scheme">${esc(truncate(link.url, 70))}</span>`;
        return `<tr>
          <td>${typeBadge}</td>
          <td class="text-sm">${esc(link.text || '')}</td>
          <td class="text-sm">${urlDisplay}</td>
          <td>
            <button class="btn btn-ghost btn-sm" data-idx="${i}" data-action="copy-url" title="Copy URL">
              <svg class="icon"><use href="#icon-copy"/></svg>
            </button>
          </td>
        </tr>`;
      }).join('');
    }

    let currentFiltered = [];
    const TYPE_LABEL = { inline: 'Inline', reference: 'Reference', image: 'Image' };
    const TYPE_BG    = { inline: '#3b82f6', reference: '#8b5cf6', image: '#10b981' };

    function typeBg(type) {
      return TYPE_BG[type] || '#6b7280';
    }

    // Event delegation: one listener for all copy buttons (avoids re-wiring per render)
    el('#links-tbody').addEventListener('click', async e => {
      const btn = e.target.closest('[data-action="copy-url"]');
      if (!btn) return;
      const link = currentFiltered[+btn.dataset.idx];
      if (link?.url) { await copyText(link.url); toast('URL copied!'); }
    }, { signal });

    function exportCsv() {
      if (!allLinks.length) return;
      const rows = [['Type','Text','URL']];
      allLinks.forEach(l => rows.push([l.type, l.text||'', l.url||'']));
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      downloadFile('links.csv', csv, 'text/csv');
    }

    function exportMarkdown() {
      if (!allLinks.length) return;
      const lines = allLinks.map(l => {
        if (l.type === 'image') return `![${l.text||''}](${l.url||''})`;
        return `[${l.text||''}](${l.url||''})`;
      });
      downloadFile('links.md', lines.join('\n'));
    }

    // Auto-populate from shared markdown state
    const shared = store.get('currentMarkdown', '');
    if (shared && !el('#links-input').value) {
      el('#links-input').value = shared;
      extract();
    }

    const schedExtract = debounce(extract, 300);
    el('#links-input').addEventListener('input', e => {
      store.set('currentMarkdown', e.target.value);
      schedExtract();
    }, { signal });

    // Filter tabs
    container.querySelectorAll('.link-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        container.querySelectorAll('.link-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderTable();
      }, { signal });
    });

    el('#btn-links-copy').addEventListener('click', async () => {
      const filtered = filter === 'all' ? allLinks : allLinks.filter(l => l.type === filter);
      const text = filtered.map(l => l.url || '').filter(Boolean).join('\n');
      if (!text) { toast('No URLs to copy'); return; }
      await copyText(text);
      const btn = el('#btn-links-copy');
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('btn-copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('btn-copied'); }, 1500);
    }, { signal });

    el('#btn-links-csv').addEventListener('click', exportCsv, { signal });
    el('#btn-links-md').addEventListener('click', exportMarkdown, { signal });

    el('#btn-links-clear').addEventListener('click', () => {
      el('#links-input').value = '';
      allLinks = [];
      el('#links-count').textContent = '';
      renderTable();
    }, { signal });

    // Initial render
    renderTable();
  },

  unmount() { ctrl?.abort(); ctrl = null; },
};

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}


function TEMPLATE() { return `
<div class="tool-shell">
  <div class="tool-header">
    <button class="menu-btn" aria-label="Open menu"><svg class="icon"><use href="#icon-menu"/></svg></button>
    <span class="tool-title">Link Auditor</span>
    <span class="tool-desc">Extract &amp; inspect all links</span>
    <div class="header-spacer"></div>
    <div class="tool-actions">
      <span id="links-count" class="badge" style="margin-right:var(--sp-2)"></span>
      <button class="btn btn-secondary btn-sm" id="btn-links-md">↓ MD</button>
      <button class="btn btn-secondary btn-sm" id="btn-links-csv">↓ CSV</button>
      <button class="btn btn-secondary btn-sm" id="btn-links-clear">Clear</button>
      <button class="btn btn-primary btn-sm" id="btn-links-copy"><svg class="icon"><use href="#icon-copy"/></svg> Copy URLs</button>
    </div>
  </div>
  <div class="tool-body flex-col">
    <!-- Input -->
    <div class="panel panel-editor" style="flex-shrink:0;border-bottom:2px solid var(--border-strong)">
      <div class="panel-header"><span class="panel-label">Markdown Source</span></div>
      <textarea id="links-input" class="code-editor" style="flex:none;height:180px" spellcheck="false"
        placeholder="Paste markdown with links…&#10;&#10;[Example](https://example.com)&#10;![Image](img.png)&#10;[Ref link][ref]&#10;&#10;[ref]: https://example.com" aria-label="Markdown source"></textarea>
    </div>
    <!-- Filter + Table -->
    <div class="tool-bar">
      <span class="label" style="margin:0">Filter:</span>
      <div class="seg-ctrl">
        <button class="seg-btn link-filter-btn active" data-filter="all">All</button>
        <button class="seg-btn link-filter-btn" data-filter="inline">Inline</button>
        <button class="seg-btn link-filter-btn" data-filter="reference">Reference</button>
        <button class="seg-btn link-filter-btn" data-filter="image">Image</button>
      </div>
    </div>
    <div class="scroll-region">
      <table class="links-table" style="width:100%">
        <thead>
          <tr>
            <th style="width:90px">Type</th>
            <th>Text / Alt</th>
            <th>URL / Ref</th>
            <th style="width:40px"></th>
          </tr>
        </thead>
        <tbody id="links-tbody">
          <tr><td colspan="4" style="text-align:center;padding:var(--sp-6);color:var(--text-muted)">No links found. Paste markdown above.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`; }
