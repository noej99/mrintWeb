// @ts-check
import { defineConfig } from 'astro/config';

// 배포 환경별 기준 URL. 지정하지 않으면 production 값(https://mrint.co.kr, base 없음)을 사용한다.
// GitHub Pages 배포(.github/workflows/deploy-pages.yml)에서는 actions/configure-pages 값으로 지정한다.
//   ASTRO_SITE=https://noej99.github.io  ASTRO_BASE=/mrintWeb
const site = process.env.ASTRO_SITE || 'https://mrint.co.kr';
const base = process.env.ASTRO_BASE || undefined;

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // canonical, sitemap의 기준 URL (docs/seo.md §4)
  site,
  base,

  // URL은 trailing slash 없이 사용한다. (docs/decisions.md D-06)
  // build.format: 'file' → /company 를 company.html 로 출력해 정적 호스팅에서도 slash 없이 서빙되게 한다.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
