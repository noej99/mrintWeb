import type { NewsData } from '../schemas';

/**
 * 본문 비공개 여부 (docs/decisions.md D-18)
 * 재사용 권리가 확인(confirmed)되지 않은 외부 기사는 본문을 표시하지 않는다.
 * 화면(NewsBody)과 검색 색인(src/lib/search/documents.ts)이 같은 규칙을 사용한다.
 */
export function isNewsBodyWithheld(news: Pick<NewsData, 'rights'>): boolean {
  return news.rights !== undefined && news.rights.status !== 'confirmed';
}
