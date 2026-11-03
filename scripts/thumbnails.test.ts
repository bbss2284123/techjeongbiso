import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { renderCard, wrapTitle } from "../src/thumbnails/render";

test("제목은 두 줄로 나눔", () => {
  assert.deepEqual(wrapTitle("오류 해결\n글 초안"), ["오류 해결", "글 초안"]);
  const lines = wrapTitle("윈도우가 느려졌을 때 속도 올리는 방법");
  assert.equal(lines.length, 2);
});

test("분류 배경 위 카드는 1200x675", async () => {
  const png = await renderCard({
    categoryId: "smartphone",
    title: "오류 해결\n글 초안",
    subtitle: "발행하지 않는 형식 초안",
  });
  const meta = await sharp(png).metadata();
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 675);
});
