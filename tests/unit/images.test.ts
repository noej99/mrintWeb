/**
 * Phase 9.5 Image Migration — data image.src ↔ src/assets/images 파일 연결 검증
 * - 모든 src가 실제 파일을 가리킨다 (missing 0)
 * - 같은 원본 URL은 같은 파일을 참조한다 (중복 저장 없음)
 * - media ID가 다른 이미지는 내용이 같아도 병합하지 않는다 (401/487, 729/1376)
 * - 참조되지 않는 파일이 없다
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOME_CARDS } from '../../src/data/home';
import { resolveImage } from '../../src/lib/images';

const ROOT = process.cwd();
const ASSETS = join(ROOT, 'src', 'assets', 'images');
const DATA = join(ROOT, 'src', 'data');

interface ImageRef {
  where: string;
  src?: string | undefined;
  legacyUrl?: string | undefined;
  legacyMediaId?: number | undefined;
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const jsonFiles = (dir: string) =>
  readdirSync(join(DATA, dir))
    .filter((name) => name.endsWith('.json'))
    .map((name) => join(DATA, dir, name));

/** JSON 안의 이미지 객체(legacyUrl을 가진 객체) 수집 */
function collect(value: unknown, where: string, out: ImageRef[]): void {
  if (Array.isArray(value)) value.forEach((item, index) => collect(item, `${where}[${index}]`, out));
  else if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.legacyUrl === 'string' && obj.legacyUrl.startsWith('/wp-content/') && 'alt' in obj) {
      out.push({ where, src: obj.src as string | undefined, legacyUrl: obj.legacyUrl, legacyMediaId: obj.legacyMediaId as number | undefined });
      return;
    }
    for (const [key, child] of Object.entries(obj)) collect(child, `${where}.${key}`, out);
  }
}

const refs: ImageRef[] = [];
for (const dir of ['company', 'team', 'news', 'projects', 'business']) {
  for (const file of jsonFiles(dir)) collect(readJson(file), `${dir}/${file.split(/[\\/]/).pop()}`, refs);
}
collect(readJson(join(DATA, 'partners.json')), 'partners.json', refs);
const homeRefs: ImageRef[] = HOME_CARDS.map((card, index) => ({
  where: `home[${index}]`,
  src: card.image ?? undefined,
  legacyUrl: card.legacyImagePath,
}));
const all = [...refs, ...homeRefs];

const listFiles = (folder: string) =>
  existsSync(join(ASSETS, folder)) ? readdirSync(join(ASSETS, folder)).filter((name) => !name.startsWith('.')) : [];

describe('image.src 연결', () => {
  it('데이터 이미지 160개 (JSON 156 + Home 4) 모두 src가 있다', () => {
    expect(refs).toHaveLength(156);
    expect(homeRefs).toHaveLength(4);
    expect(all.filter((ref) => !ref.src).map((ref) => ref.where)).toEqual([]);
  });

  it('모든 src가 실제 파일을 가리킨다 (missing 0)', () => {
    const missing = all.filter((ref) => ref.src && !existsSync(join(ASSETS, ref.src)));
    expect(missing.map((ref) => `${ref.where} → ${ref.src}`)).toEqual([]);
  });

  it('src는 media/ 또는 partners/ 아래 상대 경로다 (Partner 로고는 partners/)', () => {
    for (const ref of all) {
      expect(ref.src, ref.where).toMatch(/^(media|partners|replacements)\/[^/]+\.(jpg|jpeg|png|gif|svg|webp|avif)$/);
      expect(ref.src?.startsWith('partners/'), ref.where).toBe(ref.where.startsWith('partners.json'));
    }
  });

  it('같은 원본 URL은 같은 파일을 참조한다 (중복 저장 없음)', () => {
    const byUrl = new Map<string, Set<string>>();
    for (const ref of all) {
      const set = byUrl.get(ref.legacyUrl ?? '') ?? new Set();
      set.add(ref.src ?? '');
      byUrl.set(ref.legacyUrl ?? '', set);
    }
    const conflicts = [...byUrl.entries()].filter(([, set]) => set.size > 1);
    expect(conflicts).toEqual([]);
    // 다중 사용 원본 (사전조사 §10-1)
    const uses = (src: string) => all.filter((ref) => ref.src === src).length;
    expect(uses('media/1098-scbk.jpg')).toBe(17);
    expect(uses('media/978-기업은행.jpg')).toBe(5);
    expect(uses('media/620-흥국생명_해머링맨.jpeg')).toBe(4);
  });

  it('파일명 접두어는 데이터의 legacyMediaId와 일치한다', () => {
    for (const ref of all.filter((r) => r.legacyMediaId)) {
      expect(ref.src?.split('/')[1]?.startsWith(`${ref.legacyMediaId}-`), `${ref.where} ${ref.src}`).toBe(true);
    }
  });

  it('media ID가 다른 이미지는 내용이 같아도 병합하지 않는다 (401/487, 729/1376)', () => {
    for (const ids of [
      [401, 487],
      [729, 1376],
    ]) {
      const files = ids.map((id) => listFiles('partners').find((name) => name.startsWith(`${id}-`)));
      expect(files.every(Boolean), ids.join('/')).toBe(true);
      expect(new Set(files).size).toBe(2);
    }
  });

  it('참조되지 않는 파일이 없다', () => {
    const used = new Set(all.map((ref) => ref.src));
    const orphans = ['media', 'partners'].flatMap((folder) => listFiles(folder).map((name) => `${folder}/${name}`)).filter((rel) => !used.has(rel));
    expect(orphans).toEqual([]);
    expect(listFiles('media')).toHaveLength(65);
    expect(listFiles('partners')).toHaveLength(65);
  });

  it('파일은 비어 있지 않다', () => {
    for (const folder of ['media', 'partners']) {
      for (const name of listFiles(folder)) expect(statSync(join(ASSETS, folder, name)).size, name).toBeGreaterThan(0);
    }
  });
});

describe('권리 확인 반영 (D-13, 2026-10-02)', () => {
  const imageObjects: { where: string; license?: string; aiGenerated?: string }[] = [];
  const grab = (value: unknown, where: string): void => {
    if (Array.isArray(value)) value.forEach((item, index) => grab(item, `${where}[${index}]`));
    else if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj.legacyUrl === 'string' && obj.legacyUrl.startsWith('/wp-content/') && 'alt' in obj) {
        imageObjects.push({ where, license: obj.license as string, aiGenerated: obj.aiGenerated as string });
        return;
      }
      for (const [key, child] of Object.entries(obj)) grab(child, `${where}.${key}`);
    }
  };
  for (const dir of ['company', 'team', 'news', 'projects', 'business']) {
    for (const file of jsonFiles(dir)) grab(readJson(file), file);
  }
  grab(readJson(join(DATA, 'partners.json')), 'partners.json');

  it('이미지 156개 모두 license: confirmed', () => {
    expect(imageObjects).toHaveLength(156);
    expect(imageObjects.filter((image) => image.license !== 'confirmed').map((image) => image.where)).toEqual([]);
  });

  it('aiGenerated는 권리 확인과 별개 — 변경하지 않음 (unknown)', () => {
    expect(new Set(imageObjects.map((image) => image.aiGenerated))).toEqual(new Set(['unknown']));
  });

  it('로고가 있는 Partner 65건 logoPermission: granted, 로고 없는 2건은 unknown', () => {
    const partners = readJson(join(DATA, 'partners.json')) as { id: string; logo?: unknown; logoPermission: string }[];
    expect(partners.filter((p) => p.logo).every((p) => p.logoPermission === 'granted')).toBe(true);
    expect(partners.filter((p) => p.logo)).toHaveLength(65);
    expect(partners.filter((p) => !p.logo).map((p) => [p.id, p.logoPermission])).toEqual([
      ['partner-1030', 'unknown'],
      ['partner-1130', 'unknown'],
    ]);
  });
});

describe('resolveImage', () => {
  it('src → ImageMetadata (width/height/format)', () => {
    const image = resolveImage('media/978-기업은행.jpg');
    expect(image).toMatchObject({ width: 2560, height: 1707, format: 'jpg' });
  });

  it('없는 파일은 오류 (build 실패, placeholder로 숨기지 않음)', () => {
    expect(() => resolveImage('media/does-not-exist.jpg')).toThrow(/이미지 파일이 없습니다/);
  });

  it('화면에 표시하는 데이터 이미지(Partner 제외)는 모두 resolve된다', () => {
    for (const ref of all.filter((r) => !r.src?.startsWith('partners/'))) {
      expect(() => resolveImage(ref.src ?? ''), ref.where).not.toThrow();
    }
  });
});
