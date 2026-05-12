# Markdown Tools

> A browser-based Markdown suite — convert, edit, diff, lint, and inspect Markdown entirely client-side.

**[Live app →](https://ashok2ashok.github.io/clipboard2markdown/)**

---

## Tools

| Tool | What it does |
|------|--------------|
| **Paste to Markdown** | Paste rich text (HTML) → clean Markdown with live preview. Supports history, sharing via URL, and per-paste zoom. |
| **MD ↔ HTML** | Bidirectional converter. Markdown → rendered HTML + source, or HTML → Markdown. Draggable split panes. |
| **Table Editor** | Visual spreadsheet-style table editor. Edit cells in grid, get pipe-table Markdown output instantly. |
| **TOC Generator** | Extract headings from Markdown → nested table of contents. Configurable depth, links, numbering. Insert TOC back into source. |
| **Formatter** | Normalize and lint Markdown. Fix heading spacing, collapse blank lines, trim trailing whitespace, smart typography. Shows diff of changes. |
| **Diff Viewer** | Side-by-side and unified diff of two Markdown documents. Export as `.patch`. |
| **Front Matter** | Parse and edit YAML front matter. Add/remove/type-convert fields. Preview serialized output. |
| **Link Auditor** | Extract all inline, reference, and image links from Markdown. Filter by type, copy URLs. |
| **Browser Extensions** | Copy any web selection, table, or page as Markdown via right-click context menu. |

---

## Usage

### Paste to Markdown

1. Copy formatted text from anywhere (`Ctrl+C` / `⌘C`)
2. Paste into the app (`Ctrl+V` / `⌘V`) — or click **Paste from Clipboard**
3. Markdown appears in the editor — copy, download, or share via URL

Paste again to replace. Switch Markdown flavors to re-convert on the fly.

**Mobile:** long-press → Copy → open app → tap **Paste from Clipboard**. App auto-detects clipboard content on load.

### Browser Extensions

Install the extension (Chrome/Edge/Firefox) to copy web content as Markdown without leaving the page:

- **Right-click selected text** → Copy as Markdown
- **Right-click inside a table** → Copy table as Markdown
- **Right-click anywhere** → Copy page as Markdown
- **Click toolbar icon** → open full editor

Download the latest extension zip from the [Releases page](https://github.com/ashok2ashok/clipboard2markdown/releases).

**Chrome / Edge:** Extensions → Enable Developer mode → Load unpacked → extract the zip and select the folder.

**Firefox:** `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json` from the extracted folder.

**Safari:** Requires Xcode. Run `xcrun safari-web-extension-converter <extracted-folder>/`, open the generated Xcode project, and run on macOS target.

---

## Features

- **5 Markdown flavors** — GitHub (GFM), CommonMark, Pandoc, R Markdown, MultiMarkdown
- **Draggable split panes** — resize any panel horizontally or vertically by dragging the divider
- **Live preview** — rendered with [marked](https://github.com/markedjs/marked) + [github-markdown-css](https://github.com/sindresorhus/github-markdown-css)
- **Paste history** — last 50 pastes stored locally, browse and restore
- **Share via URL** — compressed markdown embedded in the URL hash
- **Dark mode** — follows system preference, toggle in sidebar
- **No server** — runs entirely in the browser, no data leaves your machine

---

## Tech stack

| Library | Version | Role |
|---------|---------|------|
| [Turndown](https://github.com/mixmark-io/turndown) | 7.2.0 | HTML → Markdown |
| [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) | 1.0.2 | GFM tables, strikethrough, task lists |
| [marked](https://github.com/markedjs/marked) | 15.0.7 | Markdown → HTML preview |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.2.4 | Sanitize preview HTML |
| [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) | 5.8.1 | Preview styling |
| [Bootstrap](https://getbootstrap.com) | 5.3.3 | Utility classes (`d-none`, responsive) |
| [esbuild](https://esbuild.github.io) | 0.24+ | Bundle browser extension JS |
| [sharp](https://sharp.pixelplumbing.com) | 0.33+ | Generate extension PNG icons from SVG |

Web app loads libraries via CDN — no build step required. Extension requires `npm run build` in `extensions/`.

---

## Development

```bash
# Serve the web app (any static server works)
npx serve .

# Build browser extension
cd extensions
npm install
npm run build          # → extensions/dist/
npm run dev            # watch mode
```

---

## License

Released under the [MIT License](LICENSE).

Originally forked from [euangoddard/clipboard2markdown](https://github.com/euangoddard/clipboard2markdown).
