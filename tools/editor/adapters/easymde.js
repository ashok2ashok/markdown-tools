// EasyMDE adapter - lightweight MD editor with toolbar + side preview
import { load } from '../../../shared/deps.js';

const FA_URL = 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css';
const FA_SRI = 'sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN';

// Load font-awesome inline (not via deps.js registry) so it works even if
// deps.js is stale-cached from earlier versions.
function loadFontAwesome() {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${FA_URL}"]`)) return resolve();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = FA_URL;
    l.integrity = FA_SRI;
    l.crossOrigin = 'anonymous';
    l.onload = resolve;
    l.onerror = () => reject(new Error('font-awesome failed'));
    document.head.appendChild(l);
  });
}

export default {
  id: 'easymde',
  label: 'EasyMDE',
  size: '~200 KB',

  async load() {
    // font-awesome must be in DOM before easymdeCss so toolbar glyphs render.
    // EasyMDE's bundled CSS @imports from dead maxcdn URL - blocked by CSP,
    // harmless console noise. Our explicit jsdelivr load provides the icons.
    try { await loadFontAwesome(); } catch (e) { console.warn('[easymde]', e.message); }
    // githubCss styles `.markdown-body` preview class.
    await load('easymde', 'easymdeCss', 'githubCss');
  },

  async mount(container, initialMd, onChange) {
    container.innerHTML = '';
    const ta = document.createElement('textarea');
    container.appendChild(ta);
    const editor = new window.EasyMDE({
      element: ta,
      initialValue: initialMd || '',
      autofocus: false,
      spellChecker: false,
      status: ['lines', 'words', 'cursor'],
      toolbar: [
        'bold', 'italic', 'strikethrough', 'heading', '|',
        'code', 'quote', 'unordered-list', 'ordered-list', '|',
        'link', 'image', 'table', 'horizontal-rule', '|',
        'preview', 'side-by-side', 'fullscreen',
      ],
      previewClass: ['editor-preview', 'markdown-body'],
    });
    editor.codemirror.on('change', () => onChange(editor.value()));
    return { editor };
  },

  getValue(inst) { return inst.editor.value(); },
  setValue(inst, md) { inst.editor.value(md || ''); },
  destroy(inst) {
    try { inst.editor.toTextArea(); } catch {}
    inst.editor.cleanup?.();
  },
};
