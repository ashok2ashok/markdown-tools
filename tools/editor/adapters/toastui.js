// Toast UI Editor adapter - true MD/WYSIWYG split with toggle.
// JS loaded via esm.sh (resolves ProseMirror deps); CSS via jsdelivr.
import { load } from '../../../shared/deps.js';

const ESM_URL = 'https://esm.sh/@toast-ui/editor@3.2.2';

let _EditorCtor = null;

export default {
  id: 'toastui',
  label: 'Toast UI (WYSIWYG)',
  size: '~1 MB',

  async load() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    await load('toastuiCss', ...(isDark ? ['toastuiCssDark'] : []));
    if (!_EditorCtor) {
      const mod = await import(/* @vite-ignore */ ESM_URL);
      _EditorCtor = mod.default || mod.Editor;
      if (!_EditorCtor) throw new Error('Toast UI Editor ESM export missing');
    }
  },

  async mount(container, initialMd, onChange) {
    container.innerHTML = '';
    const host = document.createElement('div');
    host.style.height = '100%';
    container.appendChild(host);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const editor = new _EditorCtor({
      el: host,
      initialEditType: 'wysiwyg',
      previewStyle: 'tab',
      height: '100%',
      initialValue: initialMd || '',
      usageStatistics: false,
      hideModeSwitch: false,
      theme: isDark ? 'dark' : 'light',
    });
    editor.on('change', () => onChange(editor.getMarkdown()));
    return { editor };
  },

  getValue(inst) { return inst?.editor ? inst.editor.getMarkdown() : ''; },
  setValue(inst, md) { inst?.editor?.setMarkdown(md || '', false); },
  destroy(inst) {
    if (!inst?.editor) return;
    try { inst.editor.off('change'); } catch {}
    try { inst.editor.destroy(); } catch {}
  },
};
