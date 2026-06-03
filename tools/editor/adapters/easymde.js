// EasyMDE adapter - lightweight MD editor with toolbar + side preview
import { load } from '../../../shared/deps.js';

export default {
  id: 'easymde',
  label: 'EasyMDE',
  size: '~320 KB',

  async load() {
    // All assets self-hosted under vendor/. Font Awesome first so EasyMDE
    // toolbar glyphs have their classes/glyphs available immediately.
    // githubCss styles `.markdown-body` preview class.
    await load('fontAwesome', 'easymde', 'easymdeCss', 'githubCss');
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
