// Lazy CDN loader - each dep loaded once, SRI-verified, cached as Promise

const cache = new Map();

const REGISTRY = {
  turndown: {
    url: 'https://cdn.jsdelivr.net/npm/turndown@7.2.0/dist/turndown.js',
    integrity: 'sha384-OGauEFaI5hnS8jXK4qdSGShAUAObMBKoLXgcL1ORhRh7ulx5jPZH35qVpacIEA4Z',
    global: 'TurndownService',
  },
  turndownGfm: {
    url: 'https://cdn.jsdelivr.net/npm/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js',
    integrity: 'sha384-2TroN1N6OfLQ+K4qttptnIfMREzUlMa3hW/nZqDZXv7Sm9BkESfGEupDEqCbzyRl',
    global: 'turndownPluginGfm',
  },
  marked: {
    url: 'https://cdn.jsdelivr.net/npm/marked@15.0.7/marked.min.js',
    integrity: 'sha384-H+hy9ULve6xfxRkWIh/YOtvDdpXgV2fmAGQkIDTxIgZwNoaoBal14Di2YTMR6MzR',
    global: 'marked',
  },
  dompurify: {
    url: 'https://cdn.jsdelivr.net/npm/dompurify@3.2.4/dist/purify.min.js',
    integrity: 'sha384-eEu5CTj3qGvu9PdJuS+YlkNi7d2XxQROAFYOr59zgObtlcux1ae1Il3u7jvdCSWu',
    global: 'DOMPurify',
  },
  githubCss: {
    // SRI omitted: jsdelivr edges have served differing bytes for this URL,
    // causing intermittent integrity failures across CDN regions.
    url: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown.min.css',
    type: 'css',
  },
  // Font Awesome 4.7 - EasyMDE's bundled CSS @imports it from dead maxcdn URL;
  // we load it from jsdelivr first so toolbar icons render. The blocked maxcdn
  // @import becomes harmless console noise.
  fontAwesome: {
    url: 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
    integrity: 'sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN',
    type: 'css',
  },
  easymde: {
    url: 'https://cdn.jsdelivr.net/npm/easymde@2.20.0/dist/easymde.min.js',
    integrity: 'sha384-YDXeUfPZ4SP6vJpnF+ZMmf4B1bax6yd4Q/aNbkvLidRD843hPG5RE67M0IYT4LOq',
    global: 'EasyMDE',
  },
  easymdeCss: {
    url: 'https://cdn.jsdelivr.net/npm/easymde@2.20.0/dist/easymde.min.css',
    integrity: 'sha384-3AvV7152TgYAMYdGZPqG9BpmSH2ZW6ewTDL0QV5PyNkl19KMI+yLMdJz183N8A2d',
    type: 'css',
  },
  // Toast UI Editor 3.x ships as ESM expecting pre-bundled ProseMirror deps;
  // jsdelivr bundle requires CommonJS environment. Adapter loads JS via esm.sh
  // dynamic import (which resolves all deps). CSS still served from jsdelivr.
  toastuiCss: {
    url: 'https://cdn.jsdelivr.net/npm/@toast-ui/editor@3.2.2/dist/toastui-editor.css',
    integrity: 'sha384-iONCORmrrRFYjYipi1NS4bgFEpQ8vCnQSTma1tan96M0nM1EZOWsRoW5sy3Q/hEl',
    type: 'css',
  },
  toastuiCssDark: {
    url: 'https://cdn.jsdelivr.net/npm/@toast-ui/editor@3.2.2/dist/theme/toastui-editor-dark.css',
    integrity: 'sha384-Ok3+liBSwABxWE//cTHVpZ2V85VPNgjNP+S5en3dpDbW0Aut8M/BBjKy2WxjJj+g',
    type: 'css',
  },
};

function loadScript(name) {
  const reg = REGISTRY[name];
  return new Promise((resolve, reject) => {
    if (window[reg.global]) return resolve(window[reg.global]);
    const s = document.createElement('script');
    s.src = reg.url;
    if (reg.integrity) s.integrity = reg.integrity;
    s.crossOrigin = 'anonymous';
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
    if (reg.integrity) l.integrity = reg.integrity;
    l.crossOrigin = 'anonymous';
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
