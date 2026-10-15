import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-support.mjs';

const { buildPhrases, generateSRT } = loadTs()('lib/subtitles.ts');
const words = [
  { word: 'Hello', start: 0, end: 0.2 },
  { word: 'world', start: 0.2, end: 0.5 },
  { word: 'Again', start: 1.1, end: 1.4 },
];

test('subtitle grouping retains pause boundaries and word-count overrides', () => {
  assert.equal(buildPhrases(words).length, 2);
  assert.equal(buildPhrases(words, 3, 1).length, 3);
  assert.equal(
    buildPhrases(words)[0]
      .words.map((word) => word.word)
      .join(' '),
    'Hello world',
  );
});

test('SRT output preserves timestamps, text and empty-input behavior', () => {
  const srt = generateSRT(words);
  assert.match(srt, /1\n00:00:00,000 --> 00:00:00,650\nHello world/);
  assert.match(srt, /Again/);
  assert.equal(generateSRT([]), '');
});
