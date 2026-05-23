// Generates PNG app icons using only Node built-ins (no dependencies).
// Run: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const BR = 59, BG = 109, BB = 255; // brand #3b6dff
const WR = 255, WG = 255, WB = 255;

// ── CRC32 + PNG helpers ───────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u32(n) {
  return Buffer.from([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return Buffer.concat([u32(d.length), t, d, u32(crc32(Buffer.concat([t, d])))]);
}

function toPNG(rgba, size) {
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 3);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      row[1 + x * 3] = rgba[i]; row[2 + x * 3] = rgba[i + 1]; row[3 + x * 3] = rgba[i + 2];
    }
    rows.push(row);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Pixel drawing ─────────────────────────────────────────────────────────────
function makeCanvas(size, r, g, b) {
  const buf = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = r; buf[i * 4 + 1] = g; buf[i * 4 + 2] = b; buf[i * 4 + 3] = 255;
  }
  return buf;
}

function setPixel(buf, size, x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
}

function fillRect(buf, size, x, y, w, h, r, g, b) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setPixel(buf, size, x + dx, y + dy, r, g, b);
}

function fillRoundedRect(buf, size, x, y, w, h, radius, r, g, b) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const px = x + dx, py = y + dy;
      const lx = dx, ly = dy;
      const inTL = lx < radius && ly < radius && (lx - radius) ** 2 + (ly - radius) ** 2 > radius ** 2;
      const inTR = lx >= w - radius && ly < radius && (lx - (w - radius - 1)) ** 2 + (ly - radius) ** 2 > radius ** 2;
      const inBL = lx < radius && ly >= h - radius && (lx - radius) ** 2 + (ly - (h - radius - 1)) ** 2 > radius ** 2;
      const inBR = lx >= w - radius && ly >= h - radius && (lx - (w - radius - 1)) ** 2 + (ly - (h - radius - 1)) ** 2 > radius ** 2;
      if (!inTL && !inTR && !inBL && !inBR) setPixel(buf, size, px, py, r, g, b);
    }
  }
}

// ── Icon design ───────────────────────────────────────────────────────────────
// White rounded card with a 3×3 grid of blue dots (planner / calendar feel)
function buildIcon(size) {
  const buf = makeCanvas(size, BR, BG, BB);

  const margin = Math.round(size * 0.14);
  const card = size - margin * 2;
  const rad = Math.round(card * 0.16);
  fillRoundedRect(buf, size, margin, margin, card, card, rad, WR, WG, WB);

  // 3×3 grid of filled circles (dots)
  const gridPad = Math.round(size * 0.26);
  const cell = Math.round((size - gridPad * 2) / 3);
  const dotR = Math.round(size * 0.055);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = Math.round(gridPad + col * cell + cell / 2);
      const cy = Math.round(gridPad + row * cell + cell / 2);
      // filled circle
      for (let dy = -dotR; dy <= dotR; dy++)
        for (let dx = -dotR; dx <= dotR; dx++)
          if (dx * dx + dy * dy <= dotR * dotR)
            setPixel(buf, size, cx + dx, cy + dy, BR, BG, BB);
    }
  }

  return toPNG(buf, size);
}

writeFileSync('public/icon-192.png', buildIcon(192));
writeFileSync('public/icon-512.png', buildIcon(512));
writeFileSync('public/apple-touch-icon.png', buildIcon(180));
console.log('Icons written → public/icon-192.png, icon-512.png, apple-touch-icon.png');
