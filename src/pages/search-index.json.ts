/**
 * 전체 사이트 검색 색인 (/search-index.json) — build 시 정적 파일로 출력한다. (docs/decisions.md D-23)
 * src/data 원본에서 파생된 SearchDocument 배열. 외부 검색 서비스/서버 DB를 사용하지 않는다.
 * url은 base 미포함 사이트 경로 — 브라우저에서 withBase()를 적용한다.
 */
import type { APIRoute } from 'astro';
import { getSearchDocuments } from '@/lib/content';

export const GET: APIRoute = async () => {
  const documents = await getSearchDocuments();
  return new Response(JSON.stringify({ documents }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
