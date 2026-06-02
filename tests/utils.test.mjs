// Run with: node --test tests/utils.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  smartTypography, prettifyMarkdown, slugify, extractHeadings,
  extractLinks, parseFrontMatter, serializeFrontMatter, wordCount, diffLines,
  sanitizeUrl,
} from '../shared/utils.js';

test('smartTypography converts unicode punctuation', () => {
  assert.equal(smartTypography('“hello” — ’world’ …'), '"hello" --- \'world\' ...');
});

test('prettifyMarkdown collapses blanks and pads around headings', () => {
  const out = prettifyMarkdown('text\n# Heading\ncontent\n');
  assert.match(out, /text\n\n# Heading\n\ncontent/);
});

test('slugify produces github-style slugs', () => {
  assert.equal(slugify('Hello World!'), 'hello-world');
  assert.equal(slugify('  Multiple   Spaces  '), 'multiple-spaces');
});

test('extractHeadings dedupes slugs', () => {
  const h = extractHeadings('# Foo\n# Foo\n# Foo');
  assert.deepEqual(h.map(x => x.slug), ['foo', 'foo-1', 'foo-2']);
});

test('extractLinks separates inline / reference / image', () => {
  const md = '[a](u1) ![b](u2)\n[c][r1]\n\n[r1]: u3';
  const links = extractLinks(md);
  const types = links.map(l => l.type).sort();
  // inline: a + c (link reference [c][r1] won't match inline regex)
  // image: b
  // reference: r1
  assert.ok(types.includes('inline'));
  assert.ok(types.includes('image'));
  assert.ok(types.includes('reference'));
  // No double-count: image shouldn't appear as inline too
  const inlines = links.filter(l => l.type === 'inline');
  assert.ok(!inlines.some(l => l.url === 'u2'));
});

test('parseFrontMatter handles inline arrays and quoted strings', () => {
  const { data, body } = parseFrontMatter(`---
title: "Hello: World"
tags: [a, b, "c d"]
draft: false
count: 42
---
body content`);
  assert.equal(data.title, 'Hello: World');
  assert.deepEqual(data.tags, ['a', 'b', 'c d']);
  assert.equal(data.draft, false);
  assert.equal(data.count, 42);
  assert.equal(body, 'body content');
});

test('parseFrontMatter handles block arrays', () => {
  const { data } = parseFrontMatter(`---
tags:
  - one
  - two
---
`);
  assert.deepEqual(data.tags, ['one', 'two']);
});

test('parseFrontMatter handles literal block scalar |', () => {
  const { data } = parseFrontMatter(`---
description: |
  line one
  line two
---
`);
  assert.equal(data.description, 'line one\nline two');
});

test('serializeFrontMatter round-trips strings with special chars', () => {
  const data = { title: 'Has "quotes" and: colon', n: 5, list: ['x', 'y'] };
  const yaml = serializeFrontMatter(data);
  const round = parseFrontMatter(yaml + '\nbody').data;
  assert.equal(round.title, 'Has "quotes" and: colon');
  assert.equal(round.n, 5);
  assert.deepEqual(round.list, ['x', 'y']);
});

test('wordCount counts words and chars', () => {
  const r = wordCount('hello world');
  assert.equal(r.words, 2);
  assert.equal(r.chars, 11);
});

test('sanitizeUrl blocks dangerous schemes', () => {
  assert.equal(sanitizeUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeUrl('JaVaScRiPt:alert(1)'), '');
  assert.equal(sanitizeUrl('data:text/html,<script>'), '');
  assert.equal(sanitizeUrl('vbscript:msgbox'), '');
});

test('sanitizeUrl allows safe schemes and relative paths', () => {
  assert.equal(sanitizeUrl('https://example.com'), 'https://example.com');
  assert.equal(sanitizeUrl('http://example.com'), 'http://example.com');
  assert.equal(sanitizeUrl('mailto:a@b.c'), 'mailto:a@b.c');
  assert.equal(sanitizeUrl('/path/to/page'), '/path/to/page');
  assert.equal(sanitizeUrl('#anchor'), '#anchor');
  assert.equal(sanitizeUrl('./rel'), './rel');
  assert.equal(sanitizeUrl('plain-path'), 'plain-path');
});

test('diffLines reports insertions and deletions', () => {
  const { ops } = diffLines('a\nb\nc', 'a\nB\nc');
  const dels = ops.filter(o => o.type === 'del').length;
  const ins  = ops.filter(o => o.type === 'ins').length;
  const eq   = ops.filter(o => o.type === 'eq').length;
  assert.equal(eq, 2);
  assert.equal(dels, 1);
  assert.equal(ins, 1);
});
