import { siteConfig } from "../../site.config";

export function GET() {
  const id = siteConfig.adsense.publisherId.trim();
  const body = id
    ? `google.com, ${id}, DIRECT, f08c47fec0942fa0\n`
    : "# PLACEHOLDER: site.config.ts adsense.publisherId 가 비어 있습니다.\n# 값을 채우면 google.com, pub-..., DIRECT, f08c47fec0942fa0 줄이 만들어집니다.\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
