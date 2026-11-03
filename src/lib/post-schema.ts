import { z } from "astro/zod";
import { siteConfig } from "../../site.config";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD");
const categoryIds = siteConfig.categories.map((c) => c.id) as [string, ...string[]];

export const verificationLabels = ["직접 재현·검증", "공식 문서 확인", "미검증"] as const;
export const postKinds = ["error-fix", "ai-howto"] as const;
export const imageTypes = ["capture", "reproduction"] as const;

export const postImageSchema = z
  .object({
    id: z.string().min(1),
    src: z.string().regex(/^\//, "이미지 src는 /로 시작하는 사이트 경로"),
    alt: z.string().refine((value) => value.trim().length >= 4, "alt는 4자 이상"),
    caption: z.string().refine((value) => value.trim().length >= 4, "caption은 4자 이상"),
    type: z.enum(imageTypes),
    /** 재현 이미지는 true. 화면에는 '재현 이미지' 뱃지가 붙습니다. 캡처는 false. */
    badge: z.boolean(),
  })
  .strict()
  .superRefine((image, ctx) => {
    if (image.type === "reproduction" && image.badge !== true) {
      ctx.addIssue({
        code: "custom",
        message: "재현 이미지에는 재현 뱃지 플래그 badge: true 가 필요합니다.",
      });
    }
    if (image.type === "capture" && image.badge) {
      ctx.addIssue({
        code: "custom",
        message: "화면 캡처에는 재현 뱃지 플래그를 넣지 않습니다.",
      });
    }
    if (image.type === "reproduction" && /실제\s*캡처|직접\s*캡처/.test(`${image.alt}\n${image.caption}`)) {
      ctx.addIssue({
        code: "custom",
        message: "재현 이미지의 alt와 caption에서 실제 캡처라고 말하지 않습니다.",
      });
    }
  });

export const postSchema = z
  .object({
    title: z.string().min(8),
    description: z.string().min(40).max(180),
    date: dateString,
    updated: dateString,
    publishAt: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/, "publishAt은 날짜 또는 날짜와 시각").optional(),
    draft: z.boolean(),
    category: z.enum(categoryIds),
    tags: z.array(z.string().min(1)).min(1),
    kind: z.enum(postKinds),
    device: z.string().min(1),
    os: z.string().min(1),
    app: z.string().min(1),
    appVersion: z.string().min(1),
    verification: z.enum(verificationLabels),
    verifiedDate: dateString,
    symptoms: z.string().min(8),
    easiestFix: z.string().min(8),
    steps: z
      .array(
        z
          .object({
            title: z.string().min(2),
            body: z.string().min(4),
          })
          .strict(),
      )
      .min(1),
    sources: z
      .array(
        z
          .object({
            title: z.string().min(2),
            url: z.string().url(),
          })
          .strict(),
      )
      .min(1),
    heroImage: z.string().regex(/^\//, "heroImage는 /로 시작"),
    images: z.array(postImageSchema).min(1),
    featured: z.boolean(),
    articleId: z.string().min(3),
    errorCode: z.string().min(1).nullable().optional(),
    reproduced: z.boolean(),
    dataLossRisk: z.boolean(),
    recheckRequired: z.boolean(),
    faq: z.array(z.object({ q: z.string().min(4), a: z.string().min(8) })).optional(),
    author: z.string().min(1).optional(),
    series: z
      .object({
        id: z.string().min(1),
        order: z.number().int().positive(),
        title: z.string().min(1),
      })
      .strict()
      .optional(),
    thumbTitle: z.string().min(2).optional(),
    thumbSubtitle: z.string().min(2).optional(),
    thumbBackground: z.string().regex(/^\//).optional(),
    검색어: z.string().min(2),
    근거: z.array(z.string().regex(/^F\d+$/)),
  })
  .strict()
  .superRefine((post, ctx) => {
    for (const source of post.sources) {
      if (!source.url.startsWith("https://")) {
        ctx.addIssue({ code: "custom", message: `출처는 https 주소여야 합니다: ${source.url}` });
      }
    }
    if (post.reproduced && post.verification !== "직접 재현·검증") {
      ctx.addIssue({
        code: "custom",
        message: "reproduced가 true이면 검증 상태는 직접 재현·검증이어야 합니다.",
      });
    }
  });

export type PostImage = z.infer<typeof postImageSchema>;
export type PostFrontmatter = z.infer<typeof postSchema>;

export function publishDateOf(data: { date: string; publishAt?: string }): string {
  return data.publishAt ?? data.date;
}
