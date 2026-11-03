import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  checkPosts,
  dailyCapErrors,
  findBanned,
  imageRuleErrors,
  introErrors,
  loadPosts,
  missingNumbers,
  proseOutsideSteps,
  shotSyncErrors,
  shotTags,
} from "../src/lib/check";
import { postSchema } from "../src/lib/post-schema";
import { highlightParts } from "../src/lib/highlight";

test("원장에 없는 숫자는 실패", () => {
  const facts = [{ id: "F1", value: "버전 14", source: "https://example.com", checkedAt: "2026-11-03" }];
  assert.deepEqual(missingNumbers("빌드 번호는 22입니다.", facts), ["22"]);
});

test("원장에 있는 숫자는 통과", () => {
  const facts = [{ id: "F1", value: "버전 14", source: "https://example.com", checkedAt: "2026-11-03" }];
  assert.deepEqual(missingNumbers("확인한 버전은 14입니다.", facts), []);
});

test("태그와 주소 안의 숫자는 본문 주장으로 세지 않음", () => {
  const text = '<Shot src="/posts/sample/step-1.png" badge={true} /> 화면을 봅니다.';
  assert.deepEqual(missingNumbers(text, []), []);
});

test("금지 표현", () => {
  const hits = findBanned("오늘은 설정에 대해 알아보겠습니다.", [{ pattern: "오늘은 .{0,40}알아보", reason: "예고" }]);
  assert.equal(hits.length, 1);
});

test("형광 분할", () => {
  assert.deepEqual(highlightParts("앞 ==강조== 뒤"), [
    { mark: false, text: "앞 " },
    { mark: true, text: "강조" },
    { mark: false, text: " 뒤" },
  ]);
});

test("재현 뱃지 없는 Shot은 실패", () => {
  const images = [
    {
      id: "s1",
      src: "/posts/sample-error-fix/step-1.png",
      alt: "오류 해결 글 초안의 첫 화면 자리표시자. 기기 화면이 아닙니다.",
      caption: "이 자리는 나중에 화면으로 바꿉니다. 지금은 그려 넣은 재현 이미지입니다.",
      type: "reproduction" as const,
      badge: true,
    },
  ];
  const body = `<Shot id="s1" src="/posts/sample-error-fix/step-1.png" alt="${images[0].alt}" caption="${images[0].caption}" type="reproduction" />`;
  const errors = shotSyncErrors(body, images);
  assert.ok(errors.some((message) => message.includes("재현 뱃지")));
});

test("Shot 속성 읽기", () => {
  const tags = shotTags('<Shot id="s1" src="/a.png" badge={true} type="reproduction"></Shot>');
  assert.equal(tags[0]?.attrs.badge, "true");
  assert.equal(tags[0]?.attrs.type, "reproduction");
});

test("검증 라벨이 빠지면 스키마가 막음", () => {
  const sample = loadPosts()[0]?.data;
  assert.ok(sample);
  const broken = { ...sample, verification: "확인 안 함" };
  assert.equal(postSchema.safeParse(broken).success, false);
});

test("출처가 비면 스키마가 막음", () => {
  const sample = loadPosts()[0]?.data;
  assert.ok(sample);
  assert.equal(postSchema.safeParse({ ...sample, sources: [] }).success, false);
});

test("alt가 비면 스키마가 막음", () => {
  const sample = loadPosts()[0]?.data;
  assert.ok(sample);
  const images = sample.images.map((image, index) => (index === 0 ? { ...image, alt: " " } : image));
  assert.equal(postSchema.safeParse({ ...sample, images }).success, false);
});

test("없는 이미지 파일은 발행을 막음", () => {
  const sample = loadPosts()[0];
  assert.ok(sample);
  const images = sample.data.images.map((image, index) => (index === 0 ? { ...image, src: "/posts/missing/nope.png" } : image));
  const errors = imageRuleErrors({ ...sample.data, images }, sample.body);
  assert.ok(errors.some((message) => message.includes("없습니다")));
});

test("문제 해결 글은 이미지가 세 장보다 적으면 막음", () => {
  const sample = loadPosts()[0];
  assert.ok(sample);
  const errors = imageRuleErrors({ ...sample.data, images: sample.data.images.slice(0, 2) }, sample.body);
  assert.ok(errors.some((message) => message.includes("3장")));
});

test("도입이 세 문장을 넘으면 막음", () => {
  const errors = introErrors("첫 문장입니다. 둘째 문장입니다. 셋째 문장입니다. 넷째 문장입니다.\n\n## 1단계");
  assert.ok(errors.some((message) => message.includes("3문장")));
});

test("가장 빠른 해결이 없으면 스키마가 막음", () => {
  const sample = loadPosts()[0]?.data;
  assert.ok(sample);
  const broken = { ...sample } as { quickAnswer?: string };
  delete broken.quickAnswer;
  assert.equal(postSchema.safeParse(broken).success, false);
});

test("같은 한국 날짜에 발행 글이 세 편이면 막음", () => {
  const row = (id: string, day: string) => ({ id, data: { draft: false, date: day } });
  const errors = dailyCapErrors([row("a", "2026-11-03"), row("b", "2026-11-03"), row("c", "2026-11-03")], 2);
  assert.equal(errors.length, 1);
  assert.equal(dailyCapErrors([row("a", "2026-11-03"), row("b", "2026-11-03"), { id: "draft", data: { draft: true, date: "2026-11-03" } }], 2).length, 0);
});

test("단계 밖 본문 길이를 센다", () => {
  const body = `${"가".repeat(100)}\n\n## 1단계. 메뉴\n\n${"나".repeat(3000)}\n`;
  assert.ok([...proseOutsideSteps(body)].length < 200);
});

test("현재 글은 검수를 통과", () => {
  const posts = loadPosts();
  const draft = posts.find((post) => post.id === "sample-error-fix");
  assert.equal(draft?.data.draft, true);
  const errors = checkPosts(posts).filter((issue) => issue.level === "error");
  assert.deepEqual(errors, []);
});

test("저장소 글에 다른 사이트 흔적이 없음", () => {
  const raw = readFileSync(path.join(process.cwd(), "src/content/posts/sample-error-fix.mdx"), "utf8");
  const foreignName = ["today", "moneytip"].join("");
  const foreignKo = ["오늘의", " 머니팁"].join("");
  assert.equal(raw.toLowerCase().includes(foreignName) || raw.includes(foreignKo), false);
});
