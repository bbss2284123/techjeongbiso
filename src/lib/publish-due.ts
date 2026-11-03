import { seoulDateTime } from "./dates";

export interface PublishStamp {
  id: string;
  at: string;
}

export function publishKey(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value;
}

export function dueBetween(posts: PublishStamp[], now: Date, since: Date): PublishStamp[] {
  const nowKey = seoulDateTime(now);
  const sinceKey = seoulDateTime(since);
  return posts.filter((post) => {
    const key = publishKey(post.at);
    return key > sinceKey && key <= nowKey;
  });
}

/** 공개 시각의 한국 날짜. 날짜만 있으면 그 날, 시각이 있으면 그 시각의 날짜입니다. */
export function publishDay(at: string): string {
  return publishKey(at).slice(0, 10);
}

/** 같은 한국 날짜에서 공개 시각이 빠른 글만 max편 남깁니다. */
export function selectWithinDailyCap<T extends PublishStamp>(posts: T[], max: number): T[] {
  const groups = new Map<string, T[]>();
  for (const post of posts) {
    const day = publishDay(post.at);
    const list = groups.get(day) ?? [];
    list.push(post);
    groups.set(day, list);
  }
  const kept = new Set<string>();
  for (const list of groups.values()) {
    list.sort((a, b) => publishKey(a.at).localeCompare(publishKey(b.at)) || a.id.localeCompare(b.id));
    for (const post of list.slice(0, Math.max(0, max))) kept.add(post.id);
  }
  return posts.filter((post) => kept.has(post.id));
}
