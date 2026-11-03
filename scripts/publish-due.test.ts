import assert from "node:assert/strict";
import test from "node:test";
import { dueBetween, selectWithinDailyCap } from "../src/lib/publish-due";

test("지난 성공 이후, 지금 이전에 공개된 글만 배포 대상이다", () => {
  const posts = [
    { id: "old", at: "2026-10-28" },
    { id: "due", at: "2026-10-29T14:22" },
    { id: "later", at: "2026-10-29T18:00" },
  ];
  const now = new Date("2026-10-29T06:00:00Z");
  const since = new Date("2026-10-29T04:00:00Z");
  assert.deepEqual(
    dueBetween(posts, now, since).map((post) => post.id),
    ["due"],
  );
});

test("같은 한국 날짜에는 설정한 편수만 공개 후보가 된다", () => {
  const posts = [
    { id: "a", at: "2026-11-03T09:00" },
    { id: "b", at: "2026-11-03T15:00" },
    { id: "c", at: "2026-11-03T18:00" },
    { id: "d", at: "2026-11-04T09:00" },
  ];
  assert.deepEqual(
    selectWithinDailyCap(posts, 2).map((post) => post.id),
    ["a", "b", "d"],
  );
});
