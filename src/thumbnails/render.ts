import { readFileSync } from "node:fs";
import path from "node:path";
import satori from "satori";
import sharp from "sharp";
import { categoryById, type Category } from "../../site.config";

type Node = { type: string; props: Record<string, unknown> };

function el(type: string, style: Record<string, string | number>, children?: unknown): Node {
  const text = typeof children === "string" || Array.isArray(children);
  return {
    type,
    props: {
      style: {
        display: "flex",
        fontFamily: text ? "Pretendard" : "Pretendard",
        ...style,
      },
      children,
    },
  };
}

let fontCache: { name: string; data: Buffer; weight: 600 | 700 | 800; style: "normal" }[] | null = null;

function fonts() {
  if (fontCache) return fontCache;
  const dir = path.join(process.cwd(), "assets/fonts");
  fontCache = [
    { name: "Pretendard", data: readFileSync(path.join(dir, "Pretendard-SemiBold.otf")), weight: 600, style: "normal" },
    { name: "Pretendard", data: readFileSync(path.join(dir, "Pretendard-Bold.otf")), weight: 700, style: "normal" },
    { name: "Pretendard", data: readFileSync(path.join(dir, "Pretendard-ExtraBold.otf")), weight: 800, style: "normal" },
  ];
  return fontCache;
}

function dataUri(file: string): string {
  const buf = readFileSync(file);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export function wrapTitle(input: string): string[] {
  const raw = input.replace(/\r/g, "").trim();
  if (raw.includes("\n")) return raw.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 3);
  const chars = [...raw];
  if (chars.length <= 14) return [raw];
  const mid = Math.ceil(chars.length / 2);
  const space = raw.lastIndexOf(" ", mid + 3);
  if (space >= 4 && space <= chars.length - 4) {
    return [raw.slice(0, space).trim(), raw.slice(space + 1).trim()];
  }
  return [chars.slice(0, mid).join(""), chars.slice(mid).join("")];
}

function titleSize(lines: string[]): number {
  const longest = Math.max(...lines.map((line) => [...line].length));
  if (longest > 18) return 42;
  if (longest > 14) return 50;
  return 58;
}

export async function renderOverlay(category: Category, title: string, subtitle: string): Promise<Buffer> {
  const lines = wrapTitle(title);
  const size = titleSize(lines);
  const icon = dataUri(path.join(process.cwd(), "public/icons", `${category.id}.png`));
  const tree = el(
    "div",
    {
      width: "1200px",
      height: "675px",
      flexDirection: "column",
      justifyContent: "center",
      padding: "48px 500px 48px 64px",
      background: "transparent",
    },
    [
      el(
        "div",
        {
          alignItems: "center",
          alignSelf: "flex-start",
          background: category.pill,
          borderRadius: "999px",
          padding: "8px 18px 8px 8px",
          marginBottom: "22px",
        },
        [
          el(
            "div",
            {
              width: "42px",
              height: "42px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.94)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "10px",
            },
            {
              type: "img",
              props: { src: icon, width: 28, height: 28, style: { width: "28px", height: "28px" } },
            },
          ),
          {
            type: "span",
            props: {
              style: { color: "#ffffff", fontSize: "22px", fontWeight: 800, fontFamily: "Pretendard" },
              children: category.name,
            },
          },
        ],
      ),
      ...lines.map((line, index) => ({
        type: "div",
        props: {
          style: {
            display: "flex",
            color: "#ffffff",
            fontSize: `${size}px`,
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: "-0.03em",
            fontFamily: "Pretendard",
            marginTop: index === 0 ? "0" : "2px",
            textShadow: "0 2px 16px rgba(0,0,0,0.35)",
          },
          children: line,
        },
      })),
      el("div", { width: "46px", height: "4px", background: "#ffffff", borderRadius: "4px", marginTop: "18px", marginBottom: "16px" }),
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            color: "rgba(255,255,255,0.92)",
            fontSize: "26px",
            fontWeight: 600,
            fontFamily: "Pretendard",
            lineHeight: 1.35,
          },
          children: [...subtitle].slice(0, 32).join(""),
        },
      },
    ],
  );
  const svg = await satori(tree as never, { width: 1200, height: 675, fonts: fonts() });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderCard(input: { categoryId: string; title: string; subtitle?: string; background?: string }): Promise<Buffer> {
  const category = categoryById(input.categoryId);
  if (!category) throw new Error(`알 수 없는 분류: ${input.categoryId}`);
  const background = input.background
    ? path.join(process.cwd(), "public", input.background.replace(/^\/+/, ""))
    : path.join(process.cwd(), "public/thumb/backgrounds", `${category.id}.png`);
  const overlay = await renderOverlay(category, input.title, input.subtitle || "화면을 따라 확인합니다");
  const base = await sharp(background).resize(1200, 675, { fit: "cover" }).png().toBuffer();
  return sharp(base).composite([{ input: overlay, left: 0, top: 0 }]).png().toBuffer();
}

export async function renderOg(card: Buffer): Promise<Buffer> {
  return sharp(card).resize(1200, 630, { fit: "cover", position: "centre" }).png().toBuffer();
}

export async function renderPlaceholder(label: string): Promise<Buffer> {
  const tree = el(
    "div",
    {
      width: "1200px",
      height: "750px",
      background: "#E7EEF8",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
    },
    el(
      "div",
      {
        width: "1040px",
        height: "600px",
        background: "#ffffff",
        border: "8px solid #122B53",
        borderRadius: "28px",
        flexDirection: "column",
        justifyContent: "center",
        padding: "48px",
      },
      [
        el("div", { fontSize: "64px", fontWeight: 800, color: "#122B53", marginBottom: "16px" }, "화면 자리표시자"),
        el("div", { fontSize: "32px", fontWeight: 600, color: "#5C6D84", marginBottom: "12px" }, label),
        el("div", { fontSize: "28px", fontWeight: 600, color: "#0962EB" }, "기기 화면이 아닙니다. 발행 전에 캡처로 바꿉니다."),
      ],
    ),
  );
  const svg = await satori(tree as never, { width: 1200, height: 750, fonts: fonts() });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
