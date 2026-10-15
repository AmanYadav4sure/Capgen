import sharp from 'sharp';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Mechanical exports of the supplied artwork: no tracing, recoloring or redrawing.
const root = fileURLToPath(new URL('../', import.meta.url));
const original = resolve(root, 'assets/branding/capgen-mark.png');
if (process.argv[2]) {
  await mkdir(resolve(root, 'assets/branding'), { recursive: true });
  await copyFile(resolve(process.argv[2]), original);
}
const output = resolve(root, 'public');
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const exportPng = (name, size, white = false) => {
  let image = sharp(original).resize(size, size, { fit: 'contain', background: transparent });
  if (white) image = image.flatten({ background: '#ffffff' });
  return image.png({ compressionLevel: 9 }).toFile(resolve(output, name));
};
await Promise.all([
  exportPng('logo.png', 512),
  exportPng('favicon.png', 96),
  exportPng('favicon-32.png', 32),
  exportPng('favicon-16.png', 16),
  exportPng('apple-touch-icon.png', 180, true),
  exportPng('icon-192.png', 192),
  exportPng('icon-512.png', 512),
  sharp(original)
    .resize(256, 256)
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(resolve(output, 'logo-icon.webp')),
]);

// Keep the complete mark inside the maskable icon's central safe area.
const inset = await sharp(original).resize(400, 400).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#ffffff' } })
  .composite([{ input: inset, gravity: 'centre' }])
  .png()
  .toFile(resolve(output, 'icon-maskable-512.png'));

// PNG-backed ICO entries preserve alpha at the common browser tab sizes.
const sizes = [16, 32, 48];
const images = await Promise.all(
  sizes.map((size) => sharp(original).resize(size, size).png().toBuffer()),
);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (const [index, size] of sizes.entries()) {
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[index].length;
}
await writeFile(resolve(output, 'favicon.ico'), Buffer.concat([header, ...images]));
console.log(
  'Exported Capgen logo, browser icons, touch icon and app icons from the supplied artwork.',
);
