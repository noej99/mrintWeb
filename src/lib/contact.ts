/** 연락처 링크 유틸리티 */

/** 표시용 전화번호('02-557-5267')를 tel: 링크로 변환한다. */
export function toTelHref(tel: string): string {
  return `tel:${tel.replace(/[^0-9+]/g, '')}`;
}

export function toMailtoHref(email: string): string {
  return `mailto:${email}`;
}
