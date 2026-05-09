export default {
  id: 'plugins',
  title: 'Browser Extensions',

  mount(container) {
    container.innerHTML = TEMPLATE();
  },

  unmount() {},
};

function TEMPLATE() {
  return `
<div class="tool-shell">
  <div class="tool-header">
    <button class="menu-btn" aria-label="Open menu"><svg class="icon"><use href="#icon-menu"/></svg></button>
    <span class="tool-title">Browser Extensions</span>
    <span class="tool-desc">Copy web content as Markdown — right from your browser</span>
    <div class="header-spacer"></div>
  </div>

  <div class="scroll-region" style="padding:var(--sp-8) var(--sp-6)">
    <div style="max-width:720px;margin:0 auto">

      <!-- Status + tagline -->
      <div style="margin-bottom:var(--sp-8);text-align:center">
        <div class="badge" style="margin-bottom:var(--sp-3);font-size:var(--text-xs)">Coming Soon</div>
        <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:var(--sp-2)">Copy anything as Markdown</h2>
        <p style="color:var(--text-muted);font-size:var(--text-sm)">Right-click any page — convert selection, tables, or entire pages to clean Markdown using the same engine as this web app.</p>
      </div>

      <!-- Feature grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-8)">
        <div class="card" style="padding:var(--sp-4);display:flex;gap:var(--sp-3);align-items:flex-start">
          <div style="font-size:1.2rem;flex-shrink:0">⬛</div>
          <div>
            <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:2px">Selected text</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">Right-click selection → Copy as Markdown</div>
          </div>
        </div>
        <div class="card" style="padding:var(--sp-4);display:flex;gap:var(--sp-3);align-items:flex-start">
          <div style="font-size:1.2rem;flex-shrink:0">⊞</div>
          <div>
            <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:2px">Table extraction</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">Right-click inside any table → GFM table</div>
          </div>
        </div>
        <div class="card" style="padding:var(--sp-4);display:flex;gap:var(--sp-3);align-items:flex-start">
          <div style="font-size:1.2rem;flex-shrink:0">📄</div>
          <div>
            <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:2px">Full page</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">Right-click anywhere → convert entire page</div>
          </div>
        </div>
        <div class="card" style="padding:var(--sp-4);display:flex;gap:var(--sp-3);align-items:flex-start">
          <div style="font-size:1.2rem;flex-shrink:0">✏️</div>
          <div>
            <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:2px">Full editor</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">Toolbar icon → paste, edit, preview, download</div>
          </div>
        </div>
      </div>

      <!-- Browser cards -->
      <h3 style="font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:var(--sp-4)">Install</h3>
      <div style="display:flex;flex-direction:column;gap:var(--sp-3);margin-bottom:var(--sp-8)">

        <div class="card" style="padding:var(--sp-5)">
          <div style="display:flex;align-items:center;gap:var(--sp-4)">
            <svg viewBox="0 0 32 32" width="36" height="36" aria-label="Chrome" style="flex-shrink:0">
              <circle cx="16" cy="16" r="14" fill="#4285f4"/>
              <circle cx="16" cy="16" r="5.5" fill="white"/>
              <path d="M16 10.5h14M8.3 19L2.5 9M23.7 19L29.5 9" stroke="white" stroke-width="2.5" fill="none"/>
            </svg>
            <div style="flex:1">
              <div style="font-weight:600;font-size:var(--text-base)">Chrome &amp; Edge</div>
              <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">Manifest V3 · Chrome Web Store</div>
            </div>
            <span class="badge">Coming soon</span>
          </div>
          <details style="margin-top:var(--sp-4)">
            <summary style="cursor:pointer;font-size:var(--text-xs);color:var(--text-muted);list-style:none;user-select:none;display:inline-flex;align-items:center;gap:var(--sp-1)">
              ▸ Load unpacked (developer mode)
            </summary>
            <ol style="margin-top:var(--sp-3);padding-left:var(--sp-5);font-size:var(--text-xs);color:var(--text-muted);line-height:2">
              <li>In <code>extensions/</code> run <code>npm install &amp;&amp; npm run build</code></li>
              <li>Open <strong>chrome://extensions</strong> → enable <em>Developer mode</em></li>
              <li>Click <em>Load unpacked</em> → select <code>extensions/dist/</code></li>
            </ol>
          </details>
        </div>

        <div class="card" style="padding:var(--sp-5)">
          <div style="display:flex;align-items:center;gap:var(--sp-4)">
            <svg viewBox="0 0 32 32" width="36" height="36" aria-label="Firefox" style="flex-shrink:0">
              <circle cx="16" cy="16" r="14" fill="#FF7139"/>
              <path d="M16 4a12 12 0 1 0 12 12 12 12 0 0 0-12-12" fill="#FF980A"/>
              <circle cx="16" cy="16" r="5" fill="white"/>
            </svg>
            <div style="flex:1">
              <div style="font-weight:600;font-size:var(--text-base)">Firefox</div>
              <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">Manifest V3 · Firefox Add-ons</div>
            </div>
            <span class="badge">Coming soon</span>
          </div>
          <details style="margin-top:var(--sp-4)">
            <summary style="cursor:pointer;font-size:var(--text-xs);color:var(--text-muted);list-style:none;user-select:none;display:inline-flex;align-items:center;gap:var(--sp-1)">
              ▸ Load temporary (developer mode)
            </summary>
            <ol style="margin-top:var(--sp-3);padding-left:var(--sp-5);font-size:var(--text-xs);color:var(--text-muted);line-height:2">
              <li>In <code>extensions/</code> run <code>npm install &amp;&amp; npm run build</code></li>
              <li>Open <strong>about:debugging</strong> → <em>This Firefox</em> → <em>Load Temporary Add-on</em></li>
              <li>Select <code>extensions/dist/manifest.json</code></li>
            </ol>
          </details>
        </div>

        <div class="card" style="padding:var(--sp-5)">
          <div style="display:flex;align-items:center;gap:var(--sp-4)">
            <svg viewBox="0 0 32 32" width="36" height="36" aria-label="Safari" style="flex-shrink:0">
              <circle cx="16" cy="16" r="14" fill="#006CFF"/>
              <line x1="16" y1="5" x2="16" y2="27" stroke="white" stroke-width="1.5"/>
              <line x1="5" y1="16" x2="27" y2="16" stroke="white" stroke-width="1.5"/>
              <circle cx="16" cy="16" r="3" fill="white"/>
              <polygon points="16,7 17.5,14 16,16 14.5,14" fill="#FF3B30"/>
            </svg>
            <div style="flex:1">
              <div style="font-weight:600;font-size:var(--text-base)">Safari</div>
              <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">macOS · Mac App Store · Xcode required</div>
            </div>
            <span class="badge">Coming soon</span>
          </div>
          <details style="margin-top:var(--sp-4)">
            <summary style="cursor:pointer;font-size:var(--text-xs);color:var(--text-muted);list-style:none;user-select:none;display:inline-flex;align-items:center;gap:var(--sp-1)">
              ▸ Convert &amp; load (developer mode)
            </summary>
            <ol style="margin-top:var(--sp-3);padding-left:var(--sp-5);font-size:var(--text-xs);color:var(--text-muted);line-height:2">
              <li>In <code>extensions/</code> run <code>npm install &amp;&amp; npm run build</code></li>
              <li>Run <code>xcrun safari-web-extension-converter extensions/dist/</code></li>
              <li>Open the generated Xcode project → run on macOS target</li>
              <li>Enable in <em>Safari → Settings → Extensions</em></li>
            </ol>
          </details>
        </div>

      </div>

      <p style="font-size:var(--text-xs);color:var(--text-muted);border-top:1px solid var(--border);padding-top:var(--sp-4)">
        Source: <code>extensions/</code> in this repo. Shares conversion engine with web app — no duplicate logic. Requires Node.js 18+.
      </p>

    </div>
  </div>
</div>`;
}
