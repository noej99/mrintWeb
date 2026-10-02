// @ts-check
import { defineConfig } from 'astro/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // canonical, sitemap의 기준 URL (docs/seo.md §4)
  site: 'https://mrint.co.kr',

  // URL은 trailing slash 없이 사용한다. (docs/decisions.md D-06)
  // build.format: 'file' → /company 를 company.html 로 출력해 정적 호스팅에서도 slash 없이 서빙되게 한다.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
