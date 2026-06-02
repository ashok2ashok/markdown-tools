import { store } from './shared/store.js';

// Tool registry - lazy loaded
const TOOLS = new Map([
  ['paste',       () => import('./tools/paste/index.js')],
  ['editor',      () => import('./tools/editor/index.js')],
  ['tables',      () => import('./tools/tables/index.js')],
  ['toc',         () => import('./tools/toc/index.js')],
  ['convert',     () => import('./tools/convert/index.js')],
  ['format',      () => import('./tools/format/index.js')],
  ['frontmatter', () => import('./tools/frontmatter/index.js')],
  ['diff',        () => import('./tools/diff/index.js')],
  ['links',       () => import('./tools/links/index.js')],
  ['plugins',     () => import('./tools/plugins/index.js')],
]);

const appLayout    = document.getElementById('appLayout');
const sidebar      = document.getElementById('sidebar');
const sidebarToggle= document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const toolRoot     = document.getElementById('toolRoot');
const toolLoading  = document.getElementById('toolLoading');
const themeToggle  = document.getElementById('themeToggle');
const themeIcon    = document.getElementById('themeIcon');

let currentTool = null;
let currentId   = null;

// ── Router ──
async function navigate(id, { force = false } = {}) {
  if (!TOOLS.has(id)) id = 'paste';
  if (id === currentId && !force) return;

  // Unmount current
  if (currentTool?.unmount) currentTool.unmount();
  currentTool = null;
  currentId = id;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tool === id);
    el.setAttribute('aria-current', el.dataset.tool === id ? 'page' : 'false');
  });

  // Show loading
  toolRoot.innerHTML = '';
  toolRoot.appendChild(toolLoading);
  toolLoading.style.display = 'flex';

  try {
    const mod = await TOOLS.get(id)();
    const tool = mod.default;

    // Hide loading, mount tool
    toolLoading.style.display = 'none';
    currentTool = tool;
    tool.mount(toolRoot);
    applySavedSplits();
    enrichHandles();

    store.set('lastTool', id);
    document.title = (tool.title || 'Markdown Tools') + ' - Markdown Tools';
  } catch (err) {
    console.error('[mdtools] Tool load failed:', err);
    toolLoading.style.display = 'none';
    toolRoot.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" width="48" height="48"><use href="#icon-x"/></svg>
        <h3>Tool failed to load</h3>
        <p>Check your connection and refresh.</p>
      </div>`;
  }

  // Close mobile sidebar on navigate
  if (window.innerWidth <= 768) closeMobileSidebar();
}

function getRouteId() {
  const hash = location.hash.replace('#', '').split('?')[0] || '';
  if (hash.startsWith('share/')) return 'paste'; // share URL → paste tool
  return hash || store.get('lastTool', 'paste');
}

window.addEventListener('hashchange', () => navigate(getRouteId()));

// Brand link: if already on paste, show landing without re-navigating
document.querySelector('.brand-link')?.addEventListener('click', e => {
  if (currentId === 'paste') {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('mdtools:showLanding'));
  }
});

// ── Sidebar ──
function applyCollapsed(collapsed) {
  appLayout.classList.toggle('collapsed', collapsed);
  sidebarToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  sidebarToggle.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
}

sidebarToggle.addEventListener('click', () => {
  const next = !store.get('sidebarCollapsed', false);
  store.set('sidebarCollapsed', next);
  applyCollapsed(next);
});

function closeMobileSidebar() {
  appLayout.classList.remove('sidebar-open');
}

sidebarOverlay.addEventListener('click', closeMobileSidebar);

// Menu button (injected by each tool's tool-header)
document.addEventListener('click', e => {
  if (e.target.closest('.menu-btn')) {
    appLayout.classList.toggle('sidebar-open');
  }
});

// Keyboard nav: Escape closes mobile sidebar
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMobileSidebar();
});

// ── Theme ──
function applyTheme(theme) {
  const dark = theme === 'dark' || (theme == null && window.matchMedia('(prefers-color-scheme:dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeIcon.setAttribute('href', dark ? '#icon-sun' : '#icon-moon');
  // Sync Bootstrap theme
  document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  store.set('theme', next);
  applyTheme(next);
  themeToggle.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
});

window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', e => {
  if (store.get('theme') == null) applyTheme(null);
});

// ── Drag-to-resize split handles (event-delegated from toolRoot) ──
function applySavedSplits() {
  const sizes = store.get('splitSizes', {});
  for (const [key, pct] of Object.entries(sizes)) {
    const [tool, idx] = key.split(':');
    if (tool !== currentId) continue;
    const handles = toolRoot.querySelectorAll('.split-handle');
    const handle = handles[+idx];
    const prev = handle?.previousElementSibling;
    if (prev) prev.style.flex = `0 0 ${pct}%`;
  }
}

function handleKey(handle) {
  const handles = Array.from(toolRoot.querySelectorAll('.split-handle'));
  return `${currentId}:${handles.indexOf(handle)}`;
}

toolRoot.addEventListener('mousedown', e => {
  const handle = e.target.closest('.split-handle');
  if (!handle) return;
  e.preventDefault();

  const parent = handle.parentElement;
  const isRow = handle.dataset.dir === 'h';
  const prev = handle.previousElementSibling;
  const next = handle.nextElementSibling;
  if (!prev || !next) return;

  const parentRect = parent.getBoundingClientRect();
  handle.classList.add('dragging');
  document.body.style.cursor = isRow ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';

  let lastPct = null;

  const onMove = mv => {
    const size = isRow ? parentRect.width : parentRect.height;
    const pos  = isRow ? mv.clientX - parentRect.left : mv.clientY - parentRect.top;
    const pct  = Math.max(10, Math.min(90, (pos / size) * 100));
    lastPct = pct;
    prev.style.flex = `0 0 ${pct}%`;
    next.style.flex = '1 1 0';
    next.style.minWidth = '0';
    next.style.minHeight = '0';
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (lastPct !== null) {
      const sizes = { ...store.get('splitSizes', {}) };
      sizes[handleKey(handle)] = +lastPct.toFixed(2);
      store.set('splitSizes', sizes);
    }
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

// Keyboard support for split handles: focus + arrow keys adjust by 5%
toolRoot.addEventListener('keydown', e => {
  const handle = e.target.closest?.('.split-handle');
  if (!handle) return;
  const isRow = handle.dataset.dir === 'h';
  const decKey = isRow ? 'ArrowLeft' : 'ArrowUp';
  const incKey = isRow ? 'ArrowRight' : 'ArrowDown';
  if (e.key !== decKey && e.key !== incKey && e.key !== 'Home' && e.key !== 'End') return;
  e.preventDefault();
  const prev = handle.previousElementSibling;
  if (!prev) return;
  const parent = handle.parentElement;
  const rect = parent.getBoundingClientRect();
  const prevRect = prev.getBoundingClientRect();
  const size = isRow ? rect.width : rect.height;
  let pct = ((isRow ? prevRect.width : prevRect.height) / size) * 100;
  if (e.key === decKey) pct = Math.max(10, pct - 5);
  else if (e.key === incKey) pct = Math.min(90, pct + 5);
  else if (e.key === 'Home') pct = 10;
  else if (e.key === 'End') pct = 90;
  prev.style.flex = `0 0 ${pct}%`;
  const next = handle.nextElementSibling;
  if (next) {
    next.style.flex = '1 1 0';
    next.style.minWidth = '0';
    next.style.minHeight = '0';
  }
  const sizes = { ...store.get('splitSizes', {}) };
  sizes[handleKey(handle)] = +pct.toFixed(2);
  store.set('splitSizes', sizes);
});

// Make handles focusable after each tool mount (via MutationObserver on toolRoot would be heavier;
// rely on tool templates to render them, then enrich here)
const enrichHandles = () => {
  toolRoot.querySelectorAll('.split-handle').forEach(h => {
    if (h.tabIndex < 0) {
      h.tabIndex = 0;
      h.setAttribute('role', 'separator');
      const isRow = h.dataset.dir === 'h';
      h.setAttribute('aria-orientation', isRow ? 'vertical' : 'horizontal');
      h.setAttribute('aria-label', 'Resize panes - use arrow keys');
    }
  });
};

// ── Init ──
applyCollapsed(store.get('sidebarCollapsed', false));
applyTheme(store.get('theme', null));
themeToggle.setAttribute('aria-pressed', document.documentElement.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
navigate(getRouteId());

// Register service worker (HTTPS or localhost only).
// updateViaCache:'none' bypasses HTTP cache for sw.js itself so new SW versions
// are detected on every page load.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(reg => {
        // Force check for updates on each load
        reg.update?.();
        // Reload once when a new SW takes control (only after first install)
        let reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloaded) return;
          reloaded = true;
          location.reload();
        });
      })
      .catch(err => console.warn('[mdtools] SW register failed:', err));
  });
}
