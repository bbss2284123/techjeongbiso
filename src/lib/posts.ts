import { getCollection, type CollectionEntry } from "astro:content";
import { siteConfig } from "../../site.config";
import { isReleased } from "./dates";
import { publishKey, selectWithinDailyCap } from "./publish-due";

export type PostEntry = CollectionEntry<"posts">;

export function publishDate(post: PostEntry): string {
  return post.data.publishAt ?? post.data.date;
}

export async function allEntries(): Promise<PostEntry[]> {
  return getCollection("posts");
}

export async function allPublished(): Promise<PostEntry[]> {
  const posts = await getCollection("posts");
  const released = posts.filter((post) => !post.data.draft && isReleased(publishDate(post)));
  const visible = selectWithinDailyCap(
    released.map((post) => ({ id: post.id, at: publishKey(publishDate(post)), post })),
    siteConfig.maxPostsPerDay,
  );
  return visible
    .map((item) => item.post)
    .sort((a, b) => publishDate(b).localeCompare(publishDate(a)) || b.data.date.localeCompare(a.data.date));
}

export function postPath(id: string): string {
  return `/${id}/`;
}

export function categoryPath(id: string): string {
  return `/category/${id}/`;
}

export function readingMinutes(text: string): number {
  const chars = text.replace(/\s/g, "").length;
  return Math.max(1, Math.round(chars / 450));
}

export function relatedPosts(post: PostEntry, posts: PostEntry[]): PostEntry[] {
  return posts
    .filter((item) => item.id !== post.id)
    .map((item) => {
      const sameCategory = item.data.category === post.data.category ? 2 : 0;
      const shared = item.data.tags.filter((tag) => post.data.tags.includes(tag)).length;
      const sameDevice = item.data.device === post.data.device && post.data.device !== "지정하지 않음" ? 1 : 0;
      return { item, score: sameCategory + shared + sameDevice };
    })
    .sort((a, b) => b.score - a.score || publishDate(b.item).localeCompare(publishDate(a.item)))
    .slice(0, 3)
    .map((row) => row.item);
}

export function authorName(post: PostEntry): string {
  return post.data.author ?? siteConfig.author.name;
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / siteConfig.postsPerPage));
}
