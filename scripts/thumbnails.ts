import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderCard, renderOg, renderPlaceholder } from "../src/thumbnails/render";

const postsDir = path.join(process.cwd(), "src/content/posts");
const outRoot = path.join(process.cwd(), "public/thumb/posts");

const placeholders = [
  ["step-1.png", "첫째 자리"],
  ["step-2.png", "둘째 자리"],
  ["step-3.png", "셋째 자리"],
] as const;

async function writePlaceholders() {
  const dir = path.join(process.cwd(), "public/posts/sample-error-fix");
  mkdirSync(dir, { recursive: true });
  for (const [name, label] of placeholders) {
    const png = await renderPlaceholder(label);
    writeFileSync(path.join(dir, name), png);
  }
}

async function main() {
  await writePlaceholders();
  if (!readdirSync(postsDir, { withFileTypes: true }).some((entry) => entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))) {
    console.log("글이 없어 카드 썸네일은 만들지 않습니다.");
    return;
  }
  mkdirSync(outRoot, { recursive: true });
  for (const name of readdirSync(postsDir).filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))) {
    const id = name.replace(/\.mdx?$/, "");
    const parsed = matter(readFileSync(path.join(postsDir, name), "utf8"));
    const data = parsed.data as {
      title?: string;
      category?: string;
      thumbTitle?: string;
      thumbSubtitle?: string;
      thumbBackground?: string;
    };
    if (!data.category || !data.title) {
      console.log(`${id} 분류 또는 제목이 없어 썸네일을 건너뜁니다.`);
      continue;
    }
    const card = await renderCard({
      categoryId: data.category,
      title: data.thumbTitle || data.title,
      subtitle: data.thumbSubtitle,
      background: data.thumbBackground,
    });
    const og = await renderOg(card);
    const dir = path.join(outRoot, id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "card.png"), card);
    writeFileSync(path.join(dir, "og.png"), og);
    console.log(`썸네일 ${id}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
