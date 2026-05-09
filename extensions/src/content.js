import { htmlToMarkdown, tableToMarkdown } from './utils/converter.js';

let lastTarget = null;

// Track element under right-click for table detection
document.addEventListener('contextmenu', e => { lastTarget = e.target; }, true);

chrome.runtime.onMessage.addListener(msg => {
  switch (msg.action) {
    case 'copySelection': copySelection(); break;
    case 'copyTable':     copyTable();     break;
    case 'copyPage':      copyPage();      break;
  }
});

function selectionHtml() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return '';
  const wrap = document.createElement('div');
  for (let i = 0; i < sel.rangeCount; i++) {
    wrap.appendChild(sel.getRangeAt(i).cloneContents());
  }
  return wrap.innerHTML;
}

function nearestTable(el) {
  while (el && el !== document.body) {
    if (el.tagName === 'TABLE') return el;
    el = el.parentElement;
  }
  return null;
}

async function copySelection() {
  const html = selectionHtml();
  if (!html.trim()) { toast('No selection', 'warn'); return; }
  await clip(htmlToMarkdown(html));
  toast('Copied as Markdown');
}

async function copyTable() {
  const table = lastTarget ? nearestTable(lastTarget) : null;
  if (!table) { toast('No table at cursor', 'warn'); return; }
  await clip(tableToMarkdown(table));
  toast('Table copied as Markdown');
}

async function copyPage() {
  await clip(htmlToMarkdown(document.body.innerHTML));
  toast('Page copied as Markdown');
}

async function clip(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), {
      value: text,
      style: 'position:fixed;opacity:0;pointer-events:none',
    });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = [
    'position:fixed', 'bottom:20px', 'right:20px',
    `background:${type === 'warn' ? '#b45309' : '#1a7f4e'}`,
    'color:#fff', 'padding:10px 16px',
    'border-radius:8px', 'font:500 13px/1.4 system-ui,sans-serif',
    'z-index:2147483647', 'opacity:0', 'transition:opacity 0.18s',
    'box-shadow:0 4px 14px rgba(0,0,0,.35)', 'max-width:280px',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, 2200);
}
