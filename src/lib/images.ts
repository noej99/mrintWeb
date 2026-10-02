/**
 * 이미지 resolver (Phase 9.5, docs/research/phase-9.5-images.md §16·§17)
 * - 데이터의 image.src는 src/assets/images/ 기준 경로 문자열이다. (예: 'media/978-기업은행.jpg')
 * - 파일은 build 시 import.meta.glob으로 수집하고, ResponsiveImage(astro:assets <Picture>)가 최적화한다.
 * - src가 있는데 파일이 없으면 build를 실패시킨다. (조용히 placeholder로 대체하지 않는다)
 * - src가 없는 이미지는 화면에서 placeholder를 유지한다.
 *
 * 폴더: media/ — 기존 WordPress 원본, media ID 단위 1파일 ({mediaId}-{원본 파일명})
 *       replacements/ — 고객 제공 교체 이미지
 *       partners/ — 고객사 로고. 화면 미표시(D-22: 이름 텍스트)이므로 resolver에 포함하지 않는다.
 *         (glob에 포함하면 사용하지 않는 로고 원본까지 build 결과에 복사된다. 로고 표시를 결정하면 여기에 추가)
 * partners/를 포함한 모든 data src의 파일 존재 여부는 tests/unit/images.test.ts가 검증한다.
 */
import type { ImageMetadata } from 'astro';

export const IMAGE_ASSET_ROOT = '/src/assets/images/';

const assets = import.meta.glob<ImageMetadata>(
  ['/src/assets/images/media/**/*.{jpg,jpeg,png,gif,webp,avif}', '/src/assets/images/replacements/**/*.{jpg,jpeg,png,gif,webp,avif}'],
  { eager: true, import: 'default' },
);

/** image.src → ImageMetadata. 파일이 없으면 오류 (build 실패) */
export function resolveImage(src: string): ImageMetadata {
  const asset = assets[`${IMAGE_ASSET_ROOT}${src}`];
  if (!asset) {
    throw new Error(`[images] 이미지 파일이 없습니다: src/assets/images/${src} (data의 image.src 확인)`);
  }
  return asset;
}

/** src가 있으면 ImageMetadata, 없으면 undefined (placeholder 표시) */
export function resolveOptionalImage(image: { src?: string | undefined } | null | undefined): ImageMetadata | undefined {
  return image?.src ? resolveImage(image.src) : undefined;
}
