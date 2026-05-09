import { htmlToMarkdown } from '../utils/converter.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { downloadFile, wordCount } from '../../../shared/utils.js';

let md = '';
let flavor  = localStorage.getItem('c2md-ext-flavor')  || 'gfm';
let smartTypo = localStorage.getItem('c2md-ext-smart') === 'true';
let prettify  = localStorage.getItem('c2md-ext-pretty') !== 'false';
let view = 'split';

document.addEventListener('DOMContentLoaded', () => {
  const output    = document.getElementById('output');
  const preview   = document.getElementById('preview');
  const stats     = document.getElementById('stats');
  const pasteHint = document.getElementById('pasteHint');
  const pasteBtn  = document.getElementById('pasteBtn');
  const copyBtn   = document.getElementById('copyBtn');
  const dlBtn     = document.getElementById('dlBtn');
  const flavorSel = document.getElementById('flavor');
  const smartChk  = document.getElementById('smartTypo');
  const prettyChk = document.getElementById('prettify');
  const viewBtns  = document.querySelectorAll('[data-view]');
  const themeBtn  = document.getElementById('themeBtn');

  // Init
  flavorSel.value = flavor;
  smartChk.checked  = smartTypo;
  prettyChk.checked = prettify;
  applyTheme();
  applyView();

  // Paste anywhere on the page
  document.addEventListener('paste', e => {
    const html = e.clipboardData.getData('text/html');
    if (html) { e.preventDefault(); convert(html); return; }
    const text = e.clipboardData.getData('text/plain');
    if (text) { e.preventDefault(); setMd(text); }
  });

  // Drag & drop HTML file or HTML data
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        const isHtml = file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm');
        isHtml ? convert(ev.target.result) : setMd(ev.target.result);
      };
      reader.readAsText(file);
      return;
    }
    const html = e.dataTransfer.getData('text/html');
    if (html) convert(html);
  });

  // Paste from clipboard button (uses Clipboard API read())
  pasteBtn.addEventListener('click', async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('text/html')) {
          convert(await (await item.getType('text/html')).text());
          return;
        }
        if (item.types.includes('text/plain')) {
          setMd(await (await item.getType('text/plain')).text());
          return;
        }
      }
    } catch {
      output.focus();
      alert('Paste with Ctrl+V / ⌘V anywhere on this page.');
    }
  });

  output.addEventListener('input', () => {
    md = output.value;
    updatePreview();
    updateStats();
    pasteHint.style.display = md ? 'none' : 'flex';
  });

  copyBtn.addEventListener('click', async () => {
    if (!md) return;
    await navigator.clipboard.writeText(md);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  });

  dlBtn.addEventListener('click', () => { if (md) downloadFile('output.md', md); });

  flavorSel.addEventListener('change', () => {
    flavor = flavorSel.value;
    localStorage.setItem('c2md-ext-flavor', flavor);
  });
  smartChk.addEventListener('change', () => {
    smartTypo = smartChk.checked;
    localStorage.setItem('c2md-ext-smart', smartTypo);
  });
  prettyChk.addEventListener('change', () => {
    prettify = prettyChk.checked;
    localStorage.setItem('c2md-ext-pretty', prettify);
  });

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      view = btn.dataset.view;
      viewBtns.forEach(b => b.classList.toggle('active', b.dataset.view === view));
      applyView();
    });
  });

  themeBtn.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('c2md-ext-theme', dark ? 'dark' : 'light');
    themeBtn.textContent = dark ? '☀' : '☾';
  });

  function convert(html) { setMd(htmlToMarkdown(html, { flavor, smartTypo, prettify })); }

  function setMd(text) {
    md = text;
    output.value = text;
    pasteHint.style.display = text ? 'none' : 'flex';
    updatePreview();
    updateStats();
    if (text) output.focus();
  }

  function updatePreview() {
    preview.innerHTML = DOMPurify.sanitize(marked.parse(md || ''));
  }

  function updateStats() {
    const { words, chars, lines } = wordCount(md);
    stats.textContent = `${words.toLocaleString()} words · ${chars.toLocaleString()} chars · ${lines.toLocaleString()} lines`;
  }
});

function applyTheme() {
  const stored = localStorage.getItem('c2md-ext-theme');
  const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme:dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = dark ? '☀' : '☾';
}

function applyView() {
  const edPane = document.getElementById('editorPane');
  const prPane = document.getElementById('previewPane');
  if (!edPane || !prPane) return;
  edPane.classList.toggle('hidden', view === 'preview');
  prPane.classList.toggle('hidden', view === 'editor');
}
