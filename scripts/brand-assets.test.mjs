import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const asset = (name) => new URL('../public/' + name, import.meta.url);

test('brand exports have the expected square dimensions and transparency', async () => {
  for (const [name, size, opaque] of [
    ['logo.png', 512, false],
    ['logo-icon.webp', 256, false],
    ['favicon-16.png', 16, false],
    ['favicon-32.png', 32, false],
    ['favicon.png', 96, false],
    ['apple-touch-icon.png', 180, true],
    ['icon-192.png', 192, false],
    ['icon-512.png', 512, false],
    ['icon-maskable-512.png', 512, true],
  ]) {
    const image = sharp(await readFile(asset(name)));
    const metadata = await image.metadata();
    assert.equal(metadata.width, size, name);
    assert.equal(metadata.height, size, name);
    assert.equal((await image.stats()).isOpaque, opaque, name);
  }
});

test('logo is a proportional export of the supplied source, not a replacement drawing', async () => {
  const original = await readFile(new URL('../assets/branding/capgen-mark.png', import.meta.url));
  const expected = await sharp(original).resize(512, 512).raw().toBuffer();
  const actual = await sharp(await readFile(asset('logo.png')))
    .raw()
    .toBuffer();
  assert.deepEqual(actual, expected);
});

test('favicon ICO contains valid 16, 32 and 48 pixel transparent PNG entries', async () => {
  const icon = await readFile(asset('favicon.ico'));
  assert.equal(icon.readUInt16LE(0), 0);
  assert.equal(icon.readUInt16LE(2), 1);
  assert.equal(icon.readUInt16LE(4), 3);
  for (const [index, size] of [16, 32, 48].entries()) {
    const entry = 6 + index * 16;
    assert.equal(icon[entry], size);
    assert.equal(icon[entry + 1], size);
    const length = icon.readUInt32LE(entry + 8);
    const offset = icon.readUInt32LE(entry + 12);
    assert.ok(offset + length <= icon.length);
    const metadata = await sharp(icon.subarray(offset, offset + length)).metadata();
    assert.equal(metadata.width, size);
    assert.ok(metadata.hasAlpha);
  }
});
