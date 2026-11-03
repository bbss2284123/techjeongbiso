import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parse as parseYaml } from "yaml";
import { siteConfig } from "../../site.config";
import { publishDay } from "./publish-due";
import { postSchema, publishDateOf, type PostFrontmatter, type PostImage } from "./post-schema";

export interface Fact {
  id: string;
  value: string;
  source: string;
  checkedAt: string;
  note?: string;
}

export interface LoadedPost {
  id: string;
  file: string;
  data: PostFrontmatter;
  body: string;
  raw: string;
}

export interface CheckIssue {
  level: "error" | "info";
  file: string;
  message: string;
}

const BANNED_PATH = "rules/banned.yaml";

interface BannedRule {
  phrase?: string;
  pattern?: string;
  reason: string;
}

export function loadBanned(root = process.cwd()): BannedRule[] {
  const file = path.join(root, BANNED_PATH);
  return parseYaml(readFileSync(file, "utf8")) as BannedRule[];
}

export function stripIgnored(text: string): string {
  let s = text;
  s = s.replace(/<!--\s*예시:start\s*-->[\s\S]*?<!--\s*예시:end\s*-->/g, " ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/https?:\/\/[^\s)]+/g, " ");
  s = s.replace(/^\s*\d+\.\s+/gm, "");
  s = s.replace(/\d+\s*가지/g, " ");
  return s;
}

export function numberTokens(text: string): string[] {
  const found = stripIgnored(text).match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? [];
  return found.map((n) => n.replace(/,/g, ""));
}

export function claimText(data: PostFrontmatter, body: string): string {
  const chunks = [
    data.title,
    data.description,
    data.device,
    data.os,
    data.app,
    data.appVersion,
    data.symptoms,
    data.quickAnswer,
    data.thumbTitle ?? "",
    data.thumbSubtitle ?? "",
    ...data.steps.flatMap((step) => [step.title, step.body]),
    ...data.images.flatMap((image) => [image.alt, image.caption]),
    ...(data.faq ?? []).flatMap((item) => [item.q, item.a]),
    body,
  ];
  return chunks.join("\n");
}

export function factTokens(facts: Fact[]): Set<string> {
  const set = new Set<string>();
  for (const fact of facts) {
    for (const token of numberTokens(`${fact.value}\n${fact.note ?? ""}`)) set.add(token);
  }
  return set;
}

export function missingNumbers(text: string, facts: Fact[]): string[] {
  const allowed = factTokens(facts);
  const missing = new Set<string>();
  for (const token of numberTokens(text)) {
    if (!allowed.has(token)) missing.add(token);
  }
  return [...missing];
}

export function findBanned(text: string, rules: BannedRule[]): { rule: BannedRule; hit: string }[] {
  const hits: { rule: BannedRule; hit: string }[] = [];
  for (const rule of rules) {
    if (rule.phrase && text.includes(rule.phrase)) hits.push({ rule, hit: rule.phrase });
    if (rule.pattern) {
      const re = new RegExp(rule.pattern);
      const match = text.match(re);
      if (match) hits.push({ rule, hit: match[0] });
    }
  }
  return hits;
}

const TEMPLATE_LEFTOVERS = [/introduction\s*:/i, /\blorem ipsum\b/i, /\[작성/, /\bTODO\b/, /\{\{/, /YOUR_TITLE/i];

export function templateLeftovers(text: string): string[] {
  return TEMPLATE_LEFTOVERS.filter((re) => re.test(text)).map((re) => re.source);
}

export function knownPaths(posts: { id: string; data: PostFrontmatter }[]): Set<string> {
  const paths = new Set<string>(["/", "/search", "/author", "/about", "/privacy", "/terms", "/contact", "/rss.xml"]);
  for (const post of posts) {
    if (!post.data.draft) paths.add(`/${post.id}`);
  }
  const categories = new Set(posts.filter((post) => !post.data.draft).map((post) => post.data.category));
  for (const id of categories) paths.add(`/category/${id}`);
  for (const category of ["smartphone", "pc", "ai", "apps", "car"]) paths.add(`/category/${category}`);
  const tags = new Set(posts.filter((post) => !post.data.draft).flatMap((post) => post.data.tags));
  for (const tag of tags) paths.add(`/tag/${encodeURIComponent(tag)}`);
  const series = new Set(
    posts
      .filter((post) => !post.data.draft)
      .map((post) => post.data.series?.id)
      .filter(Boolean) as string[],
  );
  for (const id of series) paths.add(`/series/${id}`);
  return paths;
}

export function internalLinks(text: string): string[] {
  const links = new Set<string>();
  const re = /(?:href=|\]\()(\/[^)\s"'#]+)/g;
  for (const match of text.matchAll(re)) {
    const raw = match[1].replace(/\/$/, "") || "/";
    links.add(raw.split("?")[0]);
  }
  return [...links];
}

export function brokenLinks(text: string, paths: Set<string>): string[] {
  return internalLinks(text).filter((link) => {
    if (/\.(png|jpe?g|webp|gif|svg|ico|txt|xml|woff2?)$/i.test(link)) return false;
    return !paths.has(link);
  });
}

export function publicFile(src: string, root = process.cwd()): string {
  return path.join(root, "public", src.replace(/^\/+/, ""));
}

export function keywordPlacementErrors(data: PostFrontmatter, body: string): string[] {
  const keyword = data.검색어.trim();
  const errors: string[] = [];
  if (!data.title.includes(keyword)) errors.push(`제목에 대표 검색어 "${keyword}"가 없습니다.`);
  if (!data.description.includes(keyword)) errors.push("메타 설명에 대표 검색어가 없습니다.");
  const descLen = [...data.description].length;
  if (descLen < 80 || descLen > 120) {
    errors.push(`메타 설명은 80~120자여야 합니다. 지금 ${descLen}자입니다.`);
  }
  const first = body
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\n\s*\n/)[0]
    ?.replace(/\s+/g, " ")
    .trim();
  if (!first?.includes(keyword)) errors.push("첫 문단에 대표 검색어가 없습니다.");
  return errors;
}

export function markdownMarkersInVisibleHtml(html: string): string[] {
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, " ");
  const hits: string[] = [];
  if (visible.includes("**")) hits.push("**");
  if (visible.includes("__")) hits.push("__");
  return hits;
}

export function emojiCount(text: string): number {
  const found = text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu);
  return found?.length ?? 0;
}

export interface ShotTag {
  raw: string;
  attrs: Record<string, string>;
}

export function shotTags(body: string): ShotTag[] {
  const tags: ShotTag[] = [];
  const re = /<Shot\b([^>]*?)(?:\/>|>[\s\S]*?<\/Shot>)/g;
  for (const match of body.matchAll(re)) {
    const raw = match[1] ?? "";
    const attrs: Record<string, string> = {};
    const attrRe = /([:@\w가-힣-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*([^}]*)\s*\})/g;
    for (const attr of raw.matchAll(attrRe)) {
      attrs[attr[1]] = (attr[2] ?? attr[3] ?? attr[4] ?? "").trim();
    }
    tags.push({ raw, attrs });
  }
  return tags;
}

export function imageRuleErrors(data: PostFrontmatter, body: string, root = process.cwd()): string[] {
  const errors: string[] = [];
  if (!data.verification) errors.push("검증 라벨이 없습니다.");
  if (!data.sources.length) errors.push("출처가 비어 있습니다.");
  if (data.images.length < 3) {
    const kind = data.kind === "error-fix" ? "문제 해결 글" : "사용법 글";
    errors.push(`${kind}은 이미지가 3장 이상이어야 합니다. 지금 ${data.images.length}장입니다.`);
  }
  if (!data.draft && data.verification === "미검증") {
    errors.push("미검증 글은 draft: true 로 두고 발행하지 않습니다.");
  }
  const paths = [data.heroImage, data.thumbBackground].filter(Boolean) as string[];
  for (const src of paths) {
    if (/^https?:/i.test(src)) {
      errors.push(`이미지는 저장소 파일이어야 합니다: ${src}`);
      continue;
    }
    if (!existsSync(publicFile(src, root))) errors.push(`이미지 파일이 없습니다: ${src}`);
  }
  for (const image of data.images) {
    if (!image.alt?.trim()) errors.push(`${image.id} 이미지에 alt가 없습니다.`);
    if (image.type === "reproduction" && image.badge !== true) {
      errors.push(`${image.id} 재현 이미지에 재현 뱃지 플래그(badge: true)가 없습니다.`);
    }
    if (/^https?:/i.test(image.src)) {
      errors.push(`${image.id} 이미지는 저장소 파일이어야 합니다.`);
      continue;
    }
    if (!existsSync(publicFile(image.src, root))) errors.push(`이미지 파일이 없습니다: ${image.src}`);
  }
  errors.push(...shotSyncErrors(body, data.images));
  return errors;
}

export function shotSyncErrors(body: string, images: PostImage[]): string[] {
  const errors: string[] = [];
  const tags = shotTags(body);
  const bySrc = new Map(tags.map((tag) => [tag.attrs.src, tag]));
  for (const image of images) {
    const tag = bySrc.get(image.src);
    if (!tag) {
      errors.push(`본문 Shot에 없는 이미지입니다: ${image.src}`);
      continue;
    }
    if ((tag.attrs.id ?? "") !== image.id) errors.push(`${image.id} Shot id가 프론트매터와 다릅니다.`);
    if ((tag.attrs.alt ?? "") !== image.alt) errors.push(`${image.id} Shot alt가 프론트매터와 다릅니다.`);
    if ((tag.attrs.caption ?? "") !== image.caption) errors.push(`${image.id} Shot caption이 프론트매터와 다릅니다.`);
    if ((tag.attrs.type ?? "") !== image.type) errors.push(`${image.id} Shot type이 프론트매터와 다릅니다.`);
    const flagged = tag.attrs.badge === "true";
    if (image.type === "reproduction" && !flagged) {
      errors.push(`${image.id} 재현 이미지 Shot에 재현 뱃지 플래그 badge={true}가 없습니다.`);
    }
    if (image.type === "capture" && flagged) {
      errors.push(`${image.id} 화면 캡처 Shot에 재현 뱃지를 달지 않습니다.`);
    }
  }
  for (const tag of tags) {
    if (!images.some((image) => image.src === tag.attrs.src)) {
      errors.push(`프론트매터에 없는 Shot입니다: ${tag.attrs.src ?? "(src 없음)"}`);
    }
  }
  return errors;
}

export function plainProse(text: string): string {
  return text
    .replace(/<Shot\b[^>]*\/>/g, " ")
    .replace(/<Shot\b[\s\S]*?<\/Shot>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 첫 제목 앞의 본문. 인사와 예고 없이 짧게 둡니다. */
export function introText(body: string): string {
  return plainProse(body.split(/^#{1,3}\s+/m)[0] ?? "");
}

export function sentenceCount(text: string): number {
  const parts = text
    .split(/(?<=[\.!?。])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length;
}

export function introErrors(body: string): string[] {
  const intro = introText(body);
  const errors: string[] = [];
  const chars = [...intro].length;
  if (chars > 300) errors.push(`도입은 300자 이하입니다. 지금 ${chars}자입니다.`);
  const sentences = sentenceCount(intro);
  if (sentences > 3) errors.push(`도입은 3문장 이하입니다. 지금 ${sentences}문장입니다.`);
  return errors;
}

function isStepHeading(heading: string): boolean {
  return /단계/.test(heading) || /^\s*#{1,3}\s*\d+/.test(heading);
}

/** 단계 제목 아래를 뺀 본문. 긴 에세이면 경고합니다. */
export function proseOutsideSteps(body: string): string {
  const withoutShots = body.replace(/<Shot\b[^>]*\/>/g, " ").replace(/<Shot\b[\s\S]*?<\/Shot>/g, " ");
  const chunks = withoutShots.split(/^(#{1,3}\s+.+)$/m);
  let text = chunks[0] ?? "";
  for (let index = 1; index < chunks.length; index += 2) {
    const heading = chunks[index] ?? "";
    const content = chunks[index + 1] ?? "";
    if (isStepHeading(heading)) continue;
    text += `\n${content}`;
  }
  return plainProse(text);
}

export function paddingHeadingErrors(body: string): string[] {
  const hits = body.match(/^#{1,3}\s*마무리\s*$/gm) ?? [];
  return hits.length ? ["'마무리' 제목으로 맺음 에세이를 붙이지 않습니다."] : [];
}

export function dailyCapErrors(
  posts: { id: string; data: { draft: boolean; date: string; publishAt?: string } }[],
  max = siteConfig.maxPostsPerDay,
): string[] {
  const groups = new Map<string, string[]>();
  for (const post of posts) {
    if (post.data.draft) continue;
    const day = publishDay(post.data.publishAt ?? post.data.date);
    const list = groups.get(day) ?? [];
    list.push(post.id);
    groups.set(day, list);
  }
  const errors: string[] = [];
  for (const [day, ids] of groups) {
    if (ids.length > max) {
      errors.push(`${day} (KST) 발행 글이 ${ids.length}편입니다. 하루 ${max}편까지입니다. ${ids.join(", ")}`);
    }
  }
  return errors;
}

export function loadFacts(file: string): Fact[] {
  const doc = parseYaml(readFileSync(file, "utf8")) as { facts?: Fact[] };
  return doc.facts ?? [];
}

export function validateFacts(facts: Fact[], cited: string[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  facts.forEach((fact, index) => {
    if (!/^F\d+$/.test(fact.id)) errors.push(`사실 ${index} id가 F번호가 아닙니다.`);
    if (ids.has(fact.id)) errors.push(`사실 id 중복 ${fact.id}`);
    ids.add(fact.id);
    if (!fact.value?.trim()) errors.push(`${fact.id} 값이 비었습니다.`);
    if (!fact.source?.startsWith("http")) errors.push(`${fact.id} 출처 URL이 없습니다.`);
    if (!fact.checkedAt) errors.push(`${fact.id} checkedAt이 없습니다.`);
  });
  for (const id of cited) {
    if (!ids.has(id)) errors.push(`근거 ${id}가 원장에 없습니다.`);
  }
  return errors;
}

export function loadPosts(root = process.cwd()): LoadedPost[] {
  const dir = path.join(root, "src/content/posts");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".mdx") || name.endsWith(".md"))
    .map((name) => {
      const file = path.join(dir, name);
      const raw = readFileSync(file, "utf8");
      const parsed = matter(raw);
      const id = name.replace(/\.mdx?$/, "");
      const result = postSchema.safeParse(parsed.data);
      if (!result.success) {
        const message = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
        throw new Error(`${name} 프론트매터 오류: ${message}`);
      }
      return { id, file, data: result.data, body: parsed.content, raw };
    });
}

export function checkPosts(posts: LoadedPost[], root = process.cwd()): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const rules = loadBanned(root);
  const paths = knownPaths(posts);

  for (const post of posts) {
    const factsPath = path.join(root, "work", post.id, "facts.yaml");
    if (!existsSync(factsPath)) {
      issues.push({ level: "error", file: post.id, message: "work 원장 facts.yaml이 없습니다." });
    } else {
      const facts = loadFacts(factsPath);
      for (const message of validateFacts(facts, post.data.근거)) {
        issues.push({ level: "error", file: post.id, message });
      }
      const missing = missingNumbers(claimText(post.data, post.body), facts);
      if (missing.length) {
        issues.push({ level: "error", file: post.id, message: `원장에 없는 숫자: ${missing.join(", ")}` });
      }
    }
    for (const message of imageRuleErrors(post.data, post.body, root)) {
      issues.push({ level: "error", file: post.id, message });
    }
    for (const hit of findBanned(`${post.data.title}\n${post.data.description}\n${post.body}`, rules)) {
      issues.push({ level: "error", file: post.id, message: `금지 표현 "${hit.hit}": ${hit.rule.reason}` });
    }
    for (const leftover of templateLeftovers(post.raw)) {
      issues.push({ level: "error", file: post.id, message: `템플릿 잔여: ${leftover}` });
    }
    for (const link of brokenLinks(`${post.body}\n${JSON.stringify(post.data)}`, paths)) {
      issues.push({ level: "error", file: post.id, message: `끊긴 내부 링크 ${link}` });
    }
    for (const message of keywordPlacementErrors(post.data, post.body)) {
      issues.push({ level: "error", file: post.id, message });
    }
    if (!post.data.quickAnswer.trim()) {
      issues.push({ level: "error", file: post.id, message: "가장 빠른 해결(quickAnswer)이 없습니다." });
    }
    for (const message of introErrors(post.body)) {
      issues.push({ level: "error", file: post.id, message });
    }
    for (const message of paddingHeadingErrors(post.body)) {
      issues.push({ level: "error", file: post.id, message });
    }
    const outside = [...proseOutsideSteps(post.body)].length;
    if (outside > 2500) {
      issues.push({
        level: "info",
        file: post.id,
        message: `단계 밖 본문이 ${outside}자입니다. 2500자를 넘기면 해결에 필요 없는 설명이 낀 것입니다.`,
      });
    }
    if (post.raw.toLowerCase().includes(["today", "moneytip"].join("")) || post.raw.includes(["오늘의", " 머니팁"].join(""))) {
      issues.push({ level: "error", file: post.id, message: "다른 사이트 이름이나 주소를 넣지 않습니다." });
    }
    if (emojiCount(post.body) > 0) {
      issues.push({ level: "error", file: post.id, message: "이모지를 넣지 않습니다." });
    }
    const adCount = (post.body.match(/<AdSlot\b/g) ?? []).length;
    if (adCount > 3) {
      issues.push({ level: "error", file: post.id, message: `본문 광고는 3개까지입니다. 지금 ${adCount}개입니다.` });
    }
    if (post.data.series) {
      const mates = posts.filter((item) => item.data.series?.id === post.data.series?.id && item.id !== post.id);
      if (mates.some((item) => item.data.series?.order === post.data.series?.order)) {
        issues.push({ level: "error", file: post.id, message: "시리즈 순번이 겹칩니다." });
      }
    }
  }

  for (const message of dailyCapErrors(posts)) {
    issues.push({ level: "error", file: "발행량", message });
  }

  const ledgerPath = path.join(root, "work/ledger.json");
  if (existsSync(ledgerPath)) {
    const ledger = JSON.parse(readFileSync(ledgerPath, "utf8")) as {
      posts?: Record<string, { publishedTitle?: string }>;
    };
    const changed = posts.filter((post) => {
      const published = ledger.posts?.[post.id]?.publishedTitle;
      return published && published !== post.data.title;
    });
    if (changed.length >= 2) {
      issues.push({ level: "error", file: "제목", message: "발행된 글 제목을 한꺼번에 두 개 이상 바꾸지 않습니다." });
    }
  }
  return issues;
}

export function isPublished(data: PostFrontmatter, today: string): boolean {
  return !data.draft && publishDateOf(data) <= today;
}
