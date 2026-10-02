/** 'YYYY-MM-DD' → 기존 사이트 표기 'YYYY.MM.DD' */
export function formatDotDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}
