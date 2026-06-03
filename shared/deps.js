// Lazy dep loader. All assets self-hosted under vendor/ so loads are
// same-origin -> no SRI flake, no CSP issues, no CDN edge variance.
// Each dep loaded once on demand; resolves to its window global (for scripts).

const cache = new Map();

const REGISTRY = {
  turndown: {
    url: 'vendor/turndown.js',
    global: 'TurndownService',
  },
  turndownGfm: {
    url: 'vendor/turndown-plugin-gfm.js',
    global: 'turndownPluginGfm',
  },
  marked: {
    url: 'vendor/marked.min.js',
    global: 'marked',
  },
  dompurify: {
    url: 'vendor/purify.min.js',
    global: 'DOMPurify',
  },
  githubCss: {
    url: 'vendor/github-markdown.min.css',
    type: 'css',
  },
  fontAwesome: {
    url: 'vendor/font-awesome.min.css',
    type: 'css',
  },
  easymde: {
    url: 'vendor/easymde.min.js',
    global: 'EasyMDE',
  },
  easymdeCss: {
    url: 'vendor/easymde.min.css',
    type: 'css',
  },
  // Toast UI Editor 3.x JS not viable to vendor as a single file -
  // bundle requires ProseMirror deps at runtime. Adapter resolves via
  // esm.sh dynamic import. Toast UI CSS however is self-contained.
  toastuiCss: {
    url: 'vendor/toastui-editor.css',
    type: 'css',
  },
  toastuiCssDark: {
    url: 'vendor/toastui-editor-dark.css',
    type: 'css',
  },
};

function loadScript(name) {
  const reg = REGISTRY[name];
  return new Promise((resolve, reject) => {
    if (window[reg.global]) return resolve(window[reg.global]);
    const s = document.createElement('script');
    s.src = reg.url;
    s.onload = () => resolve(window[reg.global]);
    s.onerror = () => reject(new Error(`Failed to load ${name}`));
    document.head.appendChild(s);
  });
}

function loadCSS(name) {
  const reg = REGISTRY[name];
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${reg.url}"]`)) return resolve();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = reg.url;
    l.onload = resolve;
    l.onerror = () => reject(new Error(`Failed to load ${name} CSS`));
    document.head.appendChild(l);
  });
}

export function load(...names) {
  return Promise.all(names.map(name => {
    if (!cache.has(name)) {
      const reg = REGISTRY[name];
      if (!reg) return Promise.reject(new Error(`Unknown dep: ${name}`));
      cache.set(name, reg.type === 'css' ? loadCSS(name) : loadScript(name));
    }
    return cache.get(name);
  }));
}

// Convenience: load deps needed for HTML→Markdown conversion
export async function loadConvertDeps() {
  const [TD, gfm] = await load('turndown', 'turndownGfm', 'dompurify');
  return { TurndownService: TD, turndownPluginGfm: gfm };
}

// Convenience: load deps needed for Markdown preview - applies marked config once
let _markedConfigured = false;
export async function loadPreviewDeps() {
  const [mk, dp] = await load('marked', 'dompurify', 'githubCss');
  if (!_markedConfigured && window.marked?.use) {
    window.marked.use({ breaks: true, gfm: true });
    _markedConfigured = true;
  }
  return { marked: mk, DOMPurify: dp };
}

const FLAVOR_OPTS = {
  gfm:           { headingStyle:'atx', tables:true,  strikethrough:true,  taskLists:true  },
  commonmark:    { headingStyle:'atx', tables:false, strikethrough:false, taskLists:false },
  pandoc:        { headingStyle:'atx', tables:true,  strikethrough:true,  taskLists:false },
  rmarkdown:     { headingStyle:'atx', tables:true,  strikethrough:true,  taskLists:false },
  multimarkdown: { headingStyle:'atx', tables:true,  strikethrough:false, taskLists:false },
};

// Build configured Turndown converter
export function buildConverter(flavor) {
  const f = FLAVOR_OPTS[flavor] || FLAVOR_OPTS.gfm;
  const td = new window.TurndownService({
    headingStyle: f.headingStyle, hr: '---',
    bulletListMarker: '-', codeBlockStyle: 'fenced',
    fence: '```', emDelimiter: '*', strongDelimiter: '**', linkStyle: 'inlined',
  });
  const gfm = window.turndownPluginGfm;
  if (f.strikethrough && gfm) td.use(gfm.strikethrough);
  if (f.taskLists && gfm)    td.use(gfm.taskListItems);
  if (!f.tables)              td.keep(['table']);
  td.addRule('sup', { filter: 'sup', replacement: c => `^${c}^` });
  td.addRule('sub', { filter: 'sub', replacement: c => `~${c}~` });
  return td;
}

// Lazy per-flavor converter cache
const _convCache = new Map();
export function getConverter(flavor) {
  if (!_convCache.has(flavor)) _convCache.set(flavor, buildConverter(flavor));
  return _convCache.get(flavor);
}

export function clearConverterCache() { _convCache.clear(); }
