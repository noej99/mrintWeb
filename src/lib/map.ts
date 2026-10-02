/**
 * 외부 지도 링크 (API 미사용, key 불필요)
 * Google Maps URLs: https://developers.google.com/maps/documentation/urls/get-started
 */
export interface MapPoint {
  lat: number;
  lng: number;
  zoom?: number | undefined;
  provider: 'google' | 'naver';
}

/** 좌표로 외부 지도 검색 링크를 만든다. (해당 위치에 마커 표시) */
export function buildExternalMapUrl(point: MapPoint): string {
  const query = `${point.lat},${point.lng}`;
  if (point.provider === 'naver') {
    // TODO: Naver 지도 사용 결정 시 링크 형식 확인 (docs/decisions.md D-14)
    return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
  }
  const params = new URLSearchParams({ api: '1', query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export const MAP_PROVIDER_LABEL: Record<MapPoint['provider'], string> = {
  google: 'Google 지도',
  naver: '네이버 지도',
};
