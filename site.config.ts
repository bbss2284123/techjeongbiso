/**
 * 사이트 공통 설정. 이름, 도메인, 분류, 색, 글쓴이, 광고, 분석, 인증은 여기만 바꿉니다.
 * 광고·분석·인증 값은 비어 있습니다. 채우기 전에는 스크립트를 넣지 않습니다.
 */
export interface CategoryTopic {
  label: string;
  q: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  /** 홈 타일 배경 */
  tile: string;
  /** 글·캡션·프레임에 쓰는 분류 강조색 */
  accent: string;
  /** 옅은 배경 */
  soft: string;
  /** 썸네일 알약 배경 */
  pill: string;
  topics: CategoryTopic[];
}

export const siteConfig = {
  name: "테크정비소",
  nameEn: "techgarage",
  logoText: "테크정비소",
  tagline: "오류 화면부터 해결 순서까지 보여주는 디지털 사용설명서",
  url: "https://techjeongbiso.com",
  description:
    "스마트폰, PC, 앱, AI, 자동차 전자장치의 오류를 증상과 화면 순서대로 정리하는 디지털 사용설명서입니다.",
  lang: "ko",
  locale: "ko_KR",
  contactEmail: "contact@techjeongbiso.com",
  legalUpdated: "2026-11-03",
  postsPerPage: 6,
  /** 한국 시간 기준 하루 발행 상한. 같은 날 이 편수를 넘기면 검수가 실패하고, 예약 공개도 넘긴 글을 올리지 않습니다. */
  maxPostsPerDay: 2,
  /** TODO: IndexNow 키. 비우면 키 파일을 만들지 않고 핑도 보내지 않습니다. */
  indexNowKey: "",
  author: {
    /** TODO: 실제 필명으로 바꾸세요. */
    name: "테크정비소 에디터",
    slug: "editor",
    role: "편집",
    bio: "테크정비소 에디터는 자리표시자 이름입니다. 기기에서 확인한 화면과 공식 문서만 글로 남깁니다.",
  },
  design: {
    fontFamily: '"Pretendard Variable", Pretendard, system-ui, sans-serif',
    navy: "#122B53",
    blue: "#0962EB",
    purple: "#7356DE",
    orange: "#FA712D",
    teal: "#009C8B",
    bg: "#F4F7FB",
    text: "#17304F",
    muted: "#5C6D84",
    line: "#E3EBF5",
    card: "#FFFFFF",
  },
  categories: [
    {
      id: "smartphone",
      name: "스마트폰",
      description: "발열, 배터리, 연결, 카메라, 저장 공간처럼 휴대폰에서 만나는 문제를 화면 순서로 정리합니다.",
      tile: "#EAF2FF",
      accent: "#0962EB",
      soft: "#EAF2FF",
      pill: "#2F7BE8",
      topics: [
        { label: "배터리", q: "배터리" },
        { label: "발열", q: "발열" },
        { label: "블루투스", q: "블루투스" },
        { label: "카메라", q: "카메라" },
        { label: "저장 공간", q: "저장 공간" },
      ],
    },
    {
      id: "pc",
      name: "PC·윈도우",
      description: "느린 속도, 업데이트, 인터넷, 드라이버, 프린터처럼 PC에서 만나는 문제를 화면 순서로 정리합니다.",
      tile: "#E7F3FF",
      accent: "#009C8B",
      soft: "#E5F7F4",
      pill: "#147FBF",
      topics: [
        { label: "속도", q: "윈도우 느림" },
        { label: "업데이트", q: "윈도우 업데이트" },
        { label: "인터넷", q: "인터넷 연결" },
        { label: "드라이버", q: "드라이버" },
        { label: "프린터", q: "프린터" },
      ],
    },
    {
      id: "ai",
      name: "AI 활용",
      description: "AI 도구의 시작 화면과 로그인, 파일, 저장 오류를 화면 순서로 정리합니다.",
      tile: "#F1ECFF",
      accent: "#7356DE",
      soft: "#F3EEFF",
      pill: "#7356DE",
      topics: [
        { label: "ChatGPT", q: "ChatGPT" },
        { label: "Claude", q: "Claude" },
        { label: "Gemini", q: "Gemini" },
        { label: "로그인", q: "AI 로그인" },
        { label: "파일 업로드", q: "파일 업로드" },
      ],
    },
    {
      id: "apps",
      name: "앱·프로그램",
      description: "자주 쓰는 앱이 켜지지 않거나 로그인, 설치, 파일 열기에서 멈출 때 볼 화면을 정리합니다.",
      tile: "#F4F1FC",
      accent: "#7356DE",
      soft: "#F4F0FC",
      pill: "#6A5AC8",
      topics: [
        { label: "실행 오류", q: "앱 실행" },
        { label: "설치", q: "설치 오류" },
        { label: "로그인", q: "앱 로그인" },
        { label: "PDF", q: "PDF" },
        { label: "브라우저", q: "브라우저 오류" },
      ],
    },
    {
      id: "car",
      name: "자동차 관리",
      description: "경고등, 블랙박스, 내비게이션, 휴대폰 연결처럼 차의 전자장치 문제를 정리합니다. 주행 안전과 연결된 고장은 제조사 점검을 우선합니다.",
      tile: "#FFF1EA",
      accent: "#FA712D",
      soft: "#FFF1EA",
      pill: "#0E8F86",
      topics: [
        { label: "경고등", q: "경고등" },
        { label: "블랙박스", q: "블랙박스" },
        { label: "내비게이션", q: "내비게이션" },
        { label: "안드로이드 오토", q: "안드로이드 오토" },
        { label: "카플레이", q: "카플레이" },
      ],
    },
  ] as Category[],
  adsense: {
    /** TODO: AdSense 게시자 ID (pub- 로 시작). 비우면 ads.txt 에 게시자 줄을 넣지 않습니다. */
    publisherId: "",
    slots: {
      /** TODO: 광고 슬롯 ID */
      afterIntro: "",
      midArticle: "",
      endArticle: "",
      sidebar: "",
    },
  },
  /** TODO: GA4 측정 ID (G- 로 시작). 비우면 분석 스크립트를 넣지 않습니다. */
  ga4Id: "",
  /** TODO: Cloudflare Web Analytics 토큰. 비우면 비콘을 넣지 않습니다. */
  cloudflareWebAnalyticsToken: "",
  verification: {
    /** TODO: Google Search Console 인증 코드 */
    google: "",
    naver: "8e93d00b9e8710efe96a998aa846fbd567c8453e",
    /** TODO: Bing 웹마스터 인증 코드 */
    bing: "",
  },
} as const;

export type CategoryId = (typeof siteConfig.categories)[number]["id"];

export function categoryById(id: string): Category | undefined {
  return siteConfig.categories.find((category) => category.id === id);
}

export function absoluteUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
