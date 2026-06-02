// Client-side print-to-PDF via native print dialog.
// Caller passes already-sanitized HTML (e.g. DOMPurify.sanitize(marked.parse(md))).

const CLASS_TARGET = 'print-target';
const CLASS_PRINTING = 'is-printing';

let activeNode = null;

function cleanup() {
  if (activeNode) {
    activeNode.remove();
    activeNode = null;
  }
  document.documentElement.classList.remove(CLASS_PRINTING);
}

export function printHtml(sanitizedHtml, { title } = {}) {
  cleanup(); // safety: clear any leftover from prior aborted print

  const wrap = document.createElement('article');
  wrap.className = `markdown-body ${CLASS_TARGET}`;
  wrap.innerHTML = sanitizedHtml;
  if (title) {
    const h = document.createElement('h1');
    h.textContent = title;
    h.className = 'print-title';
    wrap.prepend(h);
  }
  document.body.appendChild(wrap);
  activeNode = wrap;
  document.documentElement.classList.add(CLASS_PRINTING);

  // Restore original document title after print (browser uses it as default filename)
  const originalTitle = document.title;
  if (title) document.title = title;

  const finish = () => {
    document.title = originalTitle;
    cleanup();
    window.removeEventListener('afterprint', finish);
  };
  window.addEventListener('afterprint', finish);
  // Fallback cleanup if afterprint never fires (some mobile browsers)
  setTimeout(() => { if (activeNode) finish(); }, 60_000);

  // Defer to let layout settle before invoking print
  requestAnimationFrame(() => window.print());
}
