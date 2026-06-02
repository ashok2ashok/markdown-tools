// Plain textarea fallback - zero-dep, always available
export default {
  id: 'textarea',
  label: 'Plain (textarea)',
  size: '0 KB',

  async load() {},

  async mount(container, initialMd, onChange) {
    container.innerHTML = '';
    const ta = document.createElement('textarea');
    ta.className = 'code-editor editor-textarea';
    ta.spellcheck = false;
    ta.value = initialMd || '';
    ta.setAttribute('aria-label', 'Markdown editor');
    ta.addEventListener('input', () => onChange(ta.value));
    container.appendChild(ta);
    return { ta };
  },

  getValue(inst) { return inst.ta.value; },
  setValue(inst, md) { inst.ta.value = md || ''; },
  destroy(inst) { inst.ta.remove(); },
};
