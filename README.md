# Markdown Tools

> A browser-based Markdown suite - convert, edit, diff, lint, and inspect Markdown entirely client-side.

**[Live app →](https://ashok2ashok.github.io/markdown-tools/)**

---

## Tools

| Tool | What it does |
|------|--------------|
| **Paste to Markdown** | Paste rich text (HTML) → clean Markdown with live preview. Supports history, sharing via URL, and per-paste zoom. |
| **Editor** | Switch between markdown editors (Plain textarea, EasyMDE, Toast UI WYSIWYG) on the fly. State preserved across switches. |
| **MD ↔ HTML** | Bidirectional converter. Markdown → rendered HTML + source, or HTML → Markdown. Draggable split panes. |
| **Table Editor** | Visual spreadsheet-style table editor. Edit cells in grid, get pipe-table Markdown output instantly. |
| **TOC Generator** | Extract headings from Markdown → nested table of contents. Configurable depth, links, numbering. Insert TOC back into source. |
| **Formatter** | Normalize and lint Markdown. Fix heading spacing, collapse blank lines, trim trailing whitespace, smart typography. Shows diff of changes. |
| **Diff Viewer** | Side-by-side and unified diff of two Markdown documents. Export as `.patch`. |
| **Front Matter** | Parse and edit YAML front matter. Add/remove/type-convert fields. Preview serialized output. |
| **Link Auditor** | Extract all inline, reference, and image links from Markdown. Filter by type, copy URLs. Blocks dangerous URL schemes. |
| **Browser Extensions** | Copy any web selection, table, or page as Markdown via right-click context menu. |

Every tool supports **Print / Save as PDF** via the browser print dialog (native, selectable text, perfect typography).

---

## Usage

### Paste to Markdown

1. Copy formatted text from anywhere (`Ctrl+C` / `⌘C`)
2. Paste into the app (`Ctrl+V` / `⌘V`) - or click **Paste from Clipboard**
3. Markdown appears in the editor - copy, download, share via URL, or print to PDF

Paste again to replace. Switch Markdown flavors to re-convert on the fly.

**Keyboard shortcuts** (inside Paste tool): `Ctrl/Cmd+Enter` copy, `Ctrl/Cmd+S` download, `Ctrl/Cmd+K` clear, `Ctrl/Cmd+H` toggle history.

**Mobile:** long-press → Copy → open app → tap **Paste from Clipboard**. App auto-detects clipboard content on load.

### Editor

Pick one of three editors from the top bar. Choice persisted across sessions:

- **Plain (textarea)** - 0 KB, monospace, no styling
- **EasyMDE** - ~200 KB, MD source with toolbar and preview toggle
- **Toast UI (WYSIWYG)** - ~1 MB, true WYSIWYG/MD split with mode toggle

Markdown state shared with all other tools via local storage.

### Browser Extensions

Install the extension (Chrome/Edge/Firefox) to copy web content as Markdown without leaving the page:

- **Right-click selected text** → Copy as Markdown
- **Right-click inside a table** → Copy table as Markdown
- **Right-click anywhere** → Copy page as Markdown
- **Click toolbar icon** → open full editor

Download the latest extension zip from the [Releases page](https://github.com/ashok2ashok/markdown-tools/releases).

**Chrome / Edge:** Extensions → Enable Developer mode → Load unpacked → extract the zip and select the folder.

**Firefox:** `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json` from the extracted folder.

**Safari:** Requires Xcode. Run `xcrun safari-web-extension-converter <extracted-folder>/`, open the generated Xcode project, and run on macOS target.

---

## Features

- **5 Markdown flavors** - GitHub (GFM), CommonMark, Pandoc, R Markdown, MultiMarkdown
- **Switchable editors** - plain textarea, EasyMDE, Toast UI WYSIWYG (lazy-loaded)
- **Print to PDF** - native browser print, selectable text, smart page breaks
- **Draggable split panes** - resize any panel horizontally or vertically; sizes persisted per tool
- **Live preview** - rendered with [marked](https://github.com/markedjs/marked) + [github-markdown-css](https://github.com/sindresorhus/github-markdown-css)
- **Paste history** - last 50 pastes stored locally, browse and restore
- **Share via URL** - compressed markdown embedded in the URL hash
- **Offline support** - service worker caches app shell (network-first for updates)
- **Dark mode** - follows system preference, toggle in sidebar
- **Keyboard navigation** - skip-to-content link, focusable split handles with arrow-key resize, ARIA roles
- **No server** - runs entirely in the browser, no data leaves your machine
- **Strict CSP** - SRI-pinned CDN deps where possible, URL scheme allowlist for link rendering

---

## Tech stack

| Library | Version | Role |
|---------|---------|------|
| [Turndown](https://github.com/mixmark-io/turndown) | 7.2.0 | HTML → Markdown |
| [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) | 1.0.2 | GFM tables, strikethrough, task lists |
| [marked](https://github.com/markedjs/marked) | 15.0.7 | Markdown → HTML preview |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.2.4 | Sanitize preview HTML |
| [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) | 5.8.1 | Preview styling |
| [EasyMDE](https://github.com/Ionaru/easy-markdown-editor) | 2.20.0 | MD editor (optional, lazy-loaded) |
| [Toast UI Editor](https://github.com/nhn/tui.editor) | 3.2.2 | WYSIWYG editor (optional, lazy-loaded via esm.sh) |
| [Font Awesome](https://fontawesome.com) | 4.7.0 | EasyMDE toolbar icons |
| [Bootstrap](https://getbootstrap.com) | 5.3.3 | Utility classes (`d-none`, responsive) |
| [esbuild](https://esbuild.github.io) | 0.24+ | Bundle browser extension JS |
| [sharp](https://sharp.pixelplumbing.com) | 0.33+ | Generate extension PNG icons from SVG |

Web app loads libraries via CDN (jsDelivr + esm.sh for Toast UI ESM resolution) - no build step required. Extension requires `npm run build` in `extensions/`.

---

## Development

```bash
# Serve the web app (any static server works)
npx serve .

# Run unit tests
npm test

# Build browser extension
cd extensions
npm install
npm run build          # → extensions/dist/
npm run dev            # watch mode
```

---

## License

Released under the [MIT License](LICENSE).

Originally forked from [euangoddard/clipboard2markdown](https://github.com/euangoddard/clipboard2markdown). Now a full markdown suite.
