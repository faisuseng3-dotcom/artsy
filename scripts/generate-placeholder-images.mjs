// Generates deterministic SVG "product photography" placeholders for seed
// data. Real creator photos replace these post-launch; this only exists so
// the demo feed doesn't depend on hotlinking external images (blocked in
// this environment, and a bad practice for a real product anyway).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "seed");
mkdirSync(OUT_DIR, { recursive: true });

const palettes = [
  ["#e8ded0", "#b5502f", "#3a2e26"],
  ["#f3ece1", "#6b7f6a", "#243024"],
  ["#e4e6e1", "#3f5b6c", "#1c2933"],
  ["#efe2d6", "#8a5a3b", "#2c1e16"],
  ["#e9e3f2", "#5b4b8a", "#241c3d"],
  ["#f0e6dc", "#a13b2f", "#331512"],
  ["#e2ece6", "#2f6b52", "#12261c"],
  ["#f4e9dd", "#c07a2f", "#3b2711"],
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function shapeFor(category, rand, palette, w, h) {
  const [bg, mid, fg] = palette;
  const cx = w / 2;
  const cy = h / 2;

  switch (category) {
    case "painting":
      return `
        <rect width="${w}" height="${h}" fill="${bg}"/>
        ${Array.from({ length: 6 })
          .map((_, i) => {
            const y = h * (0.15 + i * 0.13);
            const rot = (rand() - 0.5) * 8;
            return `<rect x="${w * 0.1}" y="${y}" width="${w * 0.8}" height="${h * 0.06}" fill="${i % 2 ? mid : fg}" opacity="${0.5 + rand() * 0.4}" transform="rotate(${rot} ${cx} ${y})"/>`;
          })
          .join("")}
      `;
    case "sculpture":
      return `
        <rect width="${w}" height="${h}" fill="${bg}"/>
        <ellipse cx="${cx}" cy="${h * 0.85}" rx="${w * 0.28}" ry="${h * 0.04}" fill="${fg}" opacity="0.25"/>
        <path d="M ${cx - w * 0.12} ${h * 0.85} C ${cx - w * 0.2} ${h * 0.5}, ${cx - w * 0.05} ${h * 0.4}, ${cx} ${h * 0.15} C ${cx + w * 0.1} ${h * 0.4}, ${cx + w * 0.18} ${h * 0.55}, ${cx + w * 0.1} ${h * 0.85} Z" fill="${mid}"/>
      `;
    case "ceramics":
      return `
        <rect width="${w}" height="${h}" fill="${bg}"/>
        <path d="M ${cx - w * 0.16} ${h * 0.3} C ${cx - w * 0.22} ${h * 0.5}, ${cx - w * 0.1} ${h * 0.55}, ${cx - w * 0.14} ${h * 0.82} L ${cx + w * 0.14} ${h * 0.82} C ${cx + w * 0.1} ${h * 0.55}, ${cx + w * 0.22} ${h * 0.5}, ${cx + w * 0.16} ${h * 0.3} Z" fill="${mid}"/>
        <ellipse cx="${cx}" cy="${h * 0.3}" rx="${w * 0.16}" ry="${h * 0.02}" fill="${fg}"/>
      `;
    case "furniture":
      return `
        <rect width="${w}" height="${h}" fill="${bg}"/>
        <rect x="${w * 0.2}" y="${h * 0.28}" width="${w * 0.6}" height="${h * 0.06}" fill="${fg}"/>
        <rect x="${w * 0.22}" y="${h * 0.34}" width="${w * 0.04}" height="${h * 0.48}" fill="${mid}"/>
        <rect x="${w * 0.74}" y="${h * 0.34}" width="${w * 0.04}" height="${h * 0.48}" fill="${mid}"/>
        <rect x="${w * 0.2}" y="${h * 0.6}" width="${w * 0.6}" height="${h * 0.04}" fill="${fg}" opacity="0.6"/>
      `;
    case "jewelry":
      return `
        <rect width="${w}" height="${h}" fill="${bg}"/>
        <circle cx="${cx}" cy="${cy}" r="${w * 0.14}" fill="none" stroke="${fg}" stroke-width="${w * 0.02}"/>
        <circle cx="${cx}" cy="${cy - w * 0.14}" r="${w * 0.035}" fill="${mid}"/>
      `;
    case "textile":
      return `
        <rect width="${w}" height="${h}" fill="${bg}"/>
        ${Array.from({ length: 10 })
          .map((_, i) => `<rect x="0" y="${i * (h / 10)}" width="${w}" height="${h / 20}" fill="${i % 2 ? mid : fg}" opacity="0.5"/>`)
          .join("")}
      `;
    case "photography":
      return `
        <rect width="${w}" height="${h}" fill="${fg}"/>
        <rect x="${w * 0.08}" y="${h * 0.08}" width="${w * 0.84}" height="${h * 0.84}" fill="${bg}"/>
        <circle cx="${cx}" cy="${cy}" r="${w * 0.18}" fill="${mid}" opacity="0.7"/>
      `;
    case "woodwork":
      return `
        <rect width="${w}" height="${h}" fill="${bg}"/>
        ${Array.from({ length: 8 })
          .map((_, i) => {
            const y = (i + 1) * (h / 9);
            return `<path d="M 0 ${y} Q ${w / 2} ${y + (rand() - 0.5) * 30} ${w} ${y}" stroke="${mid}" stroke-width="2" fill="none" opacity="0.5"/>`;
          })
          .join("")}
      `;
    case "metalwork":
      return `
        <rect width="${w}" height="${h}" fill="${fg}"/>
        <polygon points="${cx},${h * 0.15} ${w * 0.85},${cy} ${cx},${h * 0.85} ${w * 0.15},${cy}" fill="${mid}"/>
      `;
    case "glass":
      return `
        <rect width="${w}" height="${h}" fill="${bg}"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${w * 0.22}" ry="${h * 0.3}" fill="${mid}" opacity="0.5"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${w * 0.12}" ry="${h * 0.18}" fill="${fg}" opacity="0.4"/>
      `;
    default:
      return `<rect width="${w}" height="${h}" fill="${bg}"/><circle cx="${cx}" cy="${cy}" r="${w * 0.2}" fill="${mid}"/>`;
  }
}

export function generate(category, seed, w = 900, h = 1125) {
  const rand = seededRandom(hashSeed(seed));
  const palette = palettes[hashSeed(seed) % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${shapeFor(
    category,
    rand,
    palette,
    w,
    h
  )}</svg>`;
  const filename = `${seed}.svg`;
  writeFileSync(join(OUT_DIR, filename), svg, "utf-8");
  return `/seed/${filename}`;
}
