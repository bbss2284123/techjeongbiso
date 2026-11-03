# 테크정비소

오류 화면부터 해결 순서까지 보여주는 디지털 사용설명서입니다.  
프로덕션 주소는 [https://techjeongbiso.com](https://techjeongbiso.com) 입니다.

Astro 정적 사이트입니다. 빌드 결과는 `dist` 이고, 검색은 Pagefind, 글 수집은 `src/content/posts` 입니다.

## 로컬에서 보기

Node.js 22가 필요합니다.

```bash
npm install
npm run dev
```

- 발행된 글만 홈에 나옵니다. 지금은 검수를 통과한 발행 글이 없습니다.
- 개발 서버에서 홈 레이아웃 시안: `/preview/home/`
- 개발 서버에서 초안 글: `/draft/sample-error-fix/`
- `npm run build` 결과에는 초안과 시안 주소가 들어가지 않습니다.

```bash
npm run check
npm run build
npm run preview
```

## Cloudflare Pages

| 항목 | 값 |
| --- | --- |
| 빌드 명령 | `npm run build` |
| 출력 디렉터리 | `dist` |
| 환경 변수 | `NODE_VERSION=22` |
| 프로덕션 도메인 | `techjeongbiso.com` |

GitHub Actions `Scheduled publish` 가 30분마다 07:00–22:30 KST 에 돌아갑니다. 저장소 비밀 `CF_PAGES_DEPLOY_HOOK` 이 없으면 배포를 건너뛰고 성공으로 끝납니다. 초안(`draft: true`)은 배포 대상이 아닙니다. `publishAt`(없으면 `date`)이 아직 오지 않은 글은 빌드에 나오지 않고, 그 시각이 지난 뒤의 예약 실행이 배포 훅을 호출합니다. 같은 한국 날짜에 공개되는 글은 `site.config.ts` 의 `maxPostsPerDay`(2)까지입니다. 더 빠른 `publishAt` 두 편만 남고, 넘는 글은 배포 대상에서 빠지며 검수도 실패합니다.

## 디렉터리

| 경로 | 역할 |
| --- | --- |
| `site.config.ts` | 이름, 도메인, 분류, 색, 글쓴이, 광고, 분석, 인증 |
| `src/content/posts` | 글. 초안도 여기 두되 `draft: true` |
| `work/<slug>/facts.yaml` | 글에 적는 숫자의 출처 원장 |
| `public/brand` | 로고, 심벌, OG, 썸네일 시안 |
| `public/icons` | 분류 아이콘 |
| `public/thumb/backgrounds` | 분류별 글자 없는 1200×675 배경 |
| `public/thumb/posts/<slug>` | 빌드가 만드는 카드·OG 이미지 |
| `docs/templates` | 오류 해결 글, AI 사용법 글 템플릿 |
| `rules/banned.yaml` | 발행을 막는 상투 표현 |

## 글을 추가하는 방법

1. `docs/templates/error-fix.mdx` 또는 `docs/templates/ai-howto.mdx` 를 `src/content/posts/<slug>.mdx` 로 복사합니다.
2. `work/<slug>/facts.yaml` 을 만듭니다. 본문·제목·증상·환경·캡션에 숫자가 없으면 `facts: []` 로 둡니다.
3. 화면 파일을 `public/posts/<slug>/` 에 넣습니다.
4. 프론트매터 `images` 와 본문 `<Shot>` 의 `id`, `src`, `alt`, `caption`, `type`, `badge` 를 같게 적습니다.
5. `npm run check` 를 통과한 뒤 `draft: false` 로 발행합니다. 미검증 글은 초안으로 남아야 합니다. 같은 한국 날짜에 발행 글은 `maxPostsPerDay`(기본 2편)까지입니다. 그 시각 전에는 `publishAt` 을 미래로 두면 그 시각에 예약 배포가 사이트를 다시 만듭니다.

## 글 쓰는 규칙

해결부터 씁니다. 인사, 배경 이야기, 예고, 맺음 에세이는 넣지 않습니다.

- 첫 화면은 제목 다음에 **증상 요약**과 **가장 빠른 해결**(`quickAnswer`)입니다. 환경은 그 아래에 붙습니다.
- 본문 첫 제목 앞의 글은 3문장, 300자 이하입니다. 넘으면 `npm run check` 가 멈춥니다.
- 그 다음은 번호 단계입니다. 단계마다 화면을 붙입니다.
- 문장은 짧게 씁니다. `마무리` 제목, `안녕하세요`, `오늘은 ~에 대해 알아보겠습니다`, `많은 분들이 궁금해하시는`, `도움이 되셨길 바랍니다`, `이상으로` 는 금지입니다.
- 단계 제목 밖 본문이 2500자를 넘으면 검수가 경고합니다. 발행은 막지 않고, 해결에 필요 없는 설명이 끼었는지 보라고 남깁니다.

대표 이미지는 직접 그리지 않아도 됩니다. `npm run thumbnails` 와 빌드가 분류 배경 위에 제목, 분류 알약, 부제를 올립니다. 글마다 다른 그림이 필요하면 1200×675 파일을 두고 `thumbBackground: "/posts/<slug>/bg.png"` 를 적습니다. 제목 줄바꿈은 `thumbTitle` 에 `\n` 을 넣습니다.

## 프론트매터

필수 값입니다.

- `title`, `description` (80–120자), `검색어` (제목·설명·첫 문단에 포함)
- `date`, `updated`, `verifiedDate` (`YYYY-MM-DD`, 따옴표로 감싸기)
- `draft`, `category` (`smartphone` `pc` `ai` `apps` `car`)
- `kind`: `error-fix` 또는 `ai-howto`
- `device`, `os`, `app`, `appVersion`
- `verification`: `직접 재현·검증` / `공식 문서 확인` / `미검증`
- `symptoms`, `quickAnswer`(가장 빠른 해결), `steps`
- `sources`: 공식 도움말 https 주소. 비우면 발행되지 않습니다.
- `heroImage`, `images[]` (`id`, `src`, `alt`, `caption`, `type`, `badge`)
- `근거`: 원장의 `F1` 같은 번호. 숫자가 없으면 `[]`
- `reproduced`, `dataLossRisk`, `recheckRequired`, `featured`, `articleId`

`featured: true` 인 글이 사이드바 **인기 글**에 올라갑니다. 조회수 집계가 아닙니다. 켠 글이 없으면 최신 글이 대신 보입니다.

## 이미지 규칙

발행은 아래를 지키지 않으면 `npm run check` 에서 멈춥니다.

- 문제 해결 글과 사용법 글 모두 이미지가 3장 미만이면 안 됩니다.
- 파일은 `public` 아래의 사이트 경로여야 하고, 빠진 파일이 있으면 안 됩니다.
- `alt` 와 `caption` 이 비면 안 됩니다.
- `verification` 이 없으면 안 됩니다.
- `type: reproduction` 이면 `badge: true` 이고, 본문 Shot 에도 `badge={true}` 가 있어야 합니다. 화면에는 **재현 이미지** 뱃지가 붙고, 캡처처럼 설명하면 안 됩니다.
- `type: capture` 이면 `badge: false` 입니다. 화면에는 **화면 캡처**가 붙습니다.
- 출처가 비면 안 됩니다.
- 미검증 글은 `draft: true` 가 아니면 발행되지 않습니다.
- 본문·환경·캡션의 숫자는 `facts.yaml` 에 없는 값이면 안 됩니다.

본문 예:

```mdx
<Shot id="s1" src="/posts/slug/step-1.png" alt="설정 화면의 배터리 메뉴" caption="배터리 항목을 누릅니다." type="capture" badge={false} />

<Shot id="s2" src="/posts/slug/mock.png" alt="메뉴 위치를 설명하는 그림" caption="직접 찍은 화면이 아닙니다." type="reproduction" badge={true}>
  <Marker n="1" x="30%" y="40%" />
  <HighlightBox x="18%" y="28%" w="36%" h="22%" />
  <Arrow dir="down" x="40%" y="20%" />
</Shot>

<Callout kind="warn">초기화하면 데이터가 지워질 수 있습니다. 먼저 백업하세요.</Callout>
```

화면은 클릭하면 라이트박스로 커지고, 모바일에서는 크게·작게 버튼으로 스크롤해서 글자를 볼 수 있습니다.

장식 색은 브랜드 색만 씁니다. 번호 원은 파랑 `#0962EB`, 화살표와 강조 상자는 주황 `#FA712D`, 캡처 뱃지는 청록 `#009C8B`, 재현 뱃지는 주황입니다. 글 프레임 테두리는 그 글의 분류 색을 따릅니다.

## 분류 색

| 분류 | 아이디 | 강조 |
| --- | --- | --- |
| 스마트폰 | `smartphone` | 파랑 `#0962EB` |
| PC·윈도우 | `pc` | 청록 `#009C8B` |
| AI 활용 | `ai` | 보라 `#7356DE` |
| 앱·프로그램 | `apps` | 보라 `#7356DE` |
| 자동차 관리 | `car` | 주황 `#FA712D` |

남색 `#122B53` 은 제목과 바닥글에 씁니다. 홈 타일 배경은 이 색의 옅은 면입니다. 자동차 글에는 제동·조향처럼 주행과 연결된 증상에 제조사 점검을 알리는 상자가 자동으로 붙습니다.

## 주인님이 채울 값

`site.config.ts` 에 `TODO` 로 비워 둔 칸입니다. 비어 있으면 스크립트와 ads.txt 게시자 줄을 넣지 않습니다.

- `author.name` — 지금은 `테크정비소 에디터`
- `contactEmail`
- `adsense.publisherId` 와 슬롯 ID
- `ga4Id`
- `cloudflareWebAnalyticsToken`
- `verification.google`, `verification.bing` (`verification.naver` 는 서치어드바이저 코드가 들어가 있습니다)
- `indexNowKey`
- GitHub 비밀 `CF_PAGES_DEPLOY_HOOK`

광고 자리 컴포넌트는 `<AdSlot position="after-intro" />`, `mid`, `end`, `sidebar` 입니다.
