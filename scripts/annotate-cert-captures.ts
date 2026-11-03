import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const uploads = "/home/ubuntu/.cursor/projects/workspace/uploads";
const outDir = path.join(process.cwd(), "public/posts/chrome-cert-error");
const cropHeight = 1152;

interface Mark {
  x: number;
  y: number;
  n: string;
}
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Arrow {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const jobs: { src: string; dest: string; marks: Mark[]; boxes: Box[]; arrows: Arrow[] }[] = [
  {
    src: "01_error_a9df.png",
    dest: "01-code.webp",
    marks: [{ x: 620, y: 468, n: "1" }],
    boxes: [{ x: 640, y: 448, w: 250, h: 40 }],
    arrows: [{ x1: 600, y1: 420, x2: 650, y2: 456 }],
  },
  {
    src: "02_error_advanced_432d.png",
    dest: "02-proceed.webp",
    marks: [],
    boxes: [{ x: 648, y: 772, w: 310, h: 44 }],
    arrows: [{ x1: 800, y1: 730, x2: 800, y2: 770 }],
  },
  {
    src: "03_incognito_de4b.png",
    dest: "03-incognito.webp",
    marks: [{ x: 1472, y: 46, n: "1" }],
    boxes: [
      { x: 1500, y: 12, w: 250, h: 66 },
      { x: 640, y: 448, w: 250, h: 40 },
    ],
    arrows: [],
  },
  {
    src: "04_clear_data_45fb.png",
    dest: "04-clear.webp",
    marks: [
      { x: 1048, y: 428, n: "1" },
      { x: 700, y: 560, n: "2" },
    ],
    boxes: [
      { x: 1076, y: 404, w: 130, h: 48 },
      { x: 720, y: 520, w: 230, h: 100 },
    ],
    arrows: [],
  },
  {
    src: "07_https_ok_11ad.png",
    dest: "05-safe.webp",
    marks: [{ x: 100, y: 158, n: "1" }],
    boxes: [{ x: 118, y: 140, w: 320, h: 40 }],
    arrows: [{ x1: 90, y1: 120, x2: 130, y2: 148 }],
  },
];

function svg(marks: Mark[], boxes: Box[], arrows: Arrow[]): Buffer {
  const boxSvg = boxes
    .map(
      (box) =>
        `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="8" fill="rgba(250,113,45,0.16)" stroke="#FA712D" stroke-width="6"/>`,
    )
    .join("");
  const arrowSvg = arrows
    .map(
      (arrow) =>
        `<line x1="${arrow.x1}" y1="${arrow.y1}" x2="${arrow.x2}" y2="${arrow.y2}" stroke="#FA712D" stroke-width="8" stroke-linecap="round"/><polygon points="${arrow.x2},${arrow.y2} ${arrow.x2 - 16},${arrow.y2 - 22} ${arrow.x2 + 16},${arrow.y2 - 22}" fill="#FA712D"/>`,
    )
    .join("");
  const markSvg = marks
    .map(
      (mark) =>
        `<circle cx="${mark.x}" cy="${mark.y}" r="26" fill="#0962EB"/><text x="${mark.x}" y="${mark.y + 10}" text-anchor="middle" font-size="28" font-family="sans-serif" font-weight="700" fill="#ffffff">${mark.n}</text>`,
    )
    .join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="${cropHeight}">${boxSvg}${arrowSvg}${markSvg}</svg>`,
  );
}

mkdirSync(outDir, { recursive: true });
for (const job of jobs) {
  const cropped = sharp(path.join(uploads, job.src)).extract({ left: 0, top: 0, width: 1920, height: cropHeight });
  const base = await cropped.png().toBuffer();
  const baseMeta = await sharp(base).metadata();
  const raster = await sharp(svg(job.marks, job.boxes, job.arrows)).png().toBuffer();
  const rasterMeta = await sharp(raster).metadata();
  const overlay = await sharp(raster).resize(baseMeta.width ?? 1920, baseMeta.height ?? 1152, { fit: "fill" }).png().toBuffer();
  const overlayMeta = await sharp(overlay).metadata();
  void rasterMeta;
  void overlayMeta;
  const flat = await sharp(base).composite([{ input: overlay, top: 0, left: 0 }]).png().toBuffer();
  const annotated = await sharp(flat).resize({ width: 1200 }).webp({ quality: 82 }).toBuffer();
  const dest = path.join(outDir, job.dest);
  await sharp(annotated).toFile(dest);
  const meta = await sharp(dest).metadata();
  console.log(job.dest, meta.width, meta.height, annotated.length);
}
