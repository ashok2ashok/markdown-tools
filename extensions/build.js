import * as esbuild from 'esbuild';
import { readFileSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes('--watch');

const SRC  = resolve(__dirname, 'src');
const DIST = resolve(__dirname, 'dist');

// Ensure output directories
for (const dir of ['', 'page', 'icons']) {
  mkdirSync(resolve(DIST, dir), { recursive: true });
}

// Copy static files
copyFileSync(resolve(__dirname, 'manifest.json'), resolve(DIST, 'manifest.json'));
copyFileSync(resolve(SRC, 'page/index.html'),     resolve(DIST, 'page/index.html'));

// Generate PNG icons from SVG source
const svg = readFileSync(resolve(__dirname, 'icons/icon.svg'));
await Promise.all([16, 32, 48, 128].map(size =>
  sharp(svg).resize(size, size).png().toFile(resolve(DIST, `icons/icon${size}.png`))
));
console.log('Icons generated.');

// esbuild shared config
const base = {
  bundle: true,
  format: 'iife',
  target: 'chrome90',
  sourcemap: false,
  logLevel: 'info',
};

if (watch) {
  const [bg, ct, pg] = await Promise.all([
    esbuild.context({ ...base, entryPoints: [resolve(SRC, 'background.js')], outfile: resolve(DIST, 'background.js') }),
    esbuild.context({ ...base, entryPoints: [resolve(SRC, 'content.js')],    outfile: resolve(DIST, 'content.js')    }),
    esbuild.context({ ...base, entryPoints: [resolve(SRC, 'page/page.js')],  outfile: resolve(DIST, 'page/page.js')  }),
  ]);
  await Promise.all([bg.watch(), ct.watch(), pg.watch()]);
  console.log('Watching for changes...');
} else {
  await Promise.all([
    esbuild.build({ ...base, entryPoints: [resolve(SRC, 'background.js')], outfile: resolve(DIST, 'background.js') }),
    esbuild.build({ ...base, entryPoints: [resolve(SRC, 'content.js')],    outfile: resolve(DIST, 'content.js')    }),
    esbuild.build({ ...base, entryPoints: [resolve(SRC, 'page/page.js')],  outfile: resolve(DIST, 'page/page.js')  }),
  ]);
  console.log(`\nBuild complete → ${DIST}/`);
  console.log('Load in Chrome: Extensions → Load unpacked → select dist/');
  console.log('Load in Firefox: about:debugging → Load Temporary Add-on → dist/manifest.json');
}
