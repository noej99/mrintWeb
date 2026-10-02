import type { Seo } from '../schemas';

export interface PageSeo {
  title: string;
  description?: string;
}

/**
 * 콘텐츠별 SEO 값 결정 (docs/decisions.md D-12)
 * - seo.status가 approved일 때만 데이터의 title/description을 사용한다.
 * - 승인 전에는 fallbackTitle(원문 제목 기반)만 사용하고 description은 출력하지 않는다. (임의 문구 생성 금지)
 */
export function resolvePageSeo(seo: Seo | undefined, fallbackTitle: string): PageSeo {
  if (seo?.status !== 'approved') return { title: fallbackTitle };
  return {
    title: seo.title ?? fallbackTitle,
    ...(seo.description ? { description: seo.description } : {}),
  };
}
