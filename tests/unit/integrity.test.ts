import { describe, expect, it } from 'vitest';
import { checkIntegrity, compareCounts } from '../../src/lib/integrity';
import {
  businessEntry,
  fixtureTerms,
  partnerEntry,
  projectEntry,
  teamEntry,
  termEntry,
} from '../fixtures/factories';

const empty = { projects: [], team: [], business: [], partners: [], taxonomies: [] };

describe('checkIntegrity', () => {
  it('데이터가 비어 있으면 문제가 없다', () => {
    expect(checkIntegrity(empty)).toEqual([]);
  });

  it('참조가 모두 유효하면 문제가 없다', () => {
    const issues = checkIntegrity({
      projects: [projectEntry('fixture-a', { relatedProjects: ['fixture-b'] }), projectEntry('fixture-b')],
      team: [teamEntry('fixture-team', { relatedProjects: ['fixture-a'] })],
      business: [businessEntry('solution', { clients: ['fixture-partner'] })],
      partners: [partnerEntry('fixture-partner', { businessLines: ['solution'] })],
      taxonomies: fixtureTerms,
    });
    expect(issues).toEqual([]);
  });

  it('taxonomies에 없는 project key를 찾는다', () => {
    const issues = checkIntegrity({
      ...empty,
      projects: [projectEntry('fixture-a', { type: 'missing-type' })],
      taxonomies: fixtureTerms,
    });
    expect(issues).toEqual([
      expect.objectContaining({ collection: 'projects', id: 'fixture-a', field: 'type' }),
    ]);
  });

  it('다른 group의 key는 인정하지 않는다', () => {
    const issues = checkIntegrity({
      ...empty,
      projects: [projectEntry('fixture-a', { status: 'fixture-type' })],
      taxonomies: fixtureTerms,
    });
    expect(issues.map((issue) => issue.field)).toEqual(['status']);
  });

  it('존재하지 않는 참조를 찾는다', () => {
    const issues = checkIntegrity({
      projects: [projectEntry('fixture-a', { relatedProjects: ['ghost-project'] })],
      team: [teamEntry('fixture-team', { relatedProjects: ['ghost-project'] })],
      business: [businessEntry('solution', { clients: ['ghost-partner'] })],
      partners: [partnerEntry('fixture-partner', { businessLines: ['infrastructure'] })],
      taxonomies: fixtureTerms,
    });
    expect(issues.map((issue) => `${issue.collection}.${issue.field}`)).toEqual([
      'projects.relatedProjects',
      'team.relatedProjects',
      'business.clients',
      'partners.businessLines',
      'partners.businessLines',
    ]);
  });

  it('Business clients 중복 참조를 찾는다', () => {
    const issues = checkIntegrity({
      ...empty,
      business: [businessEntry('solution', { clients: ['fixture-partner', 'fixture-partner'] })],
      partners: [partnerEntry('fixture-partner', { businessLines: ['solution'] })],
    });
    expect(issues).toEqual([expect.objectContaining({ collection: 'business', id: 'solution', field: 'clients' })]);
  });

  it('Partner businessLines가 Business clients 역참조와 다르면 찾는다', () => {
    const issues = checkIntegrity({
      ...empty,
      business: [
        businessEntry('solution', { clients: ['fixture-a'] }),
        businessEntry('infrastructure', { clients: [] }),
      ],
      partners: [
        partnerEntry('fixture-a', { businessLines: [] }),
        partnerEntry('fixture-b', { businessLines: ['infrastructure'] }),
      ],
    });
    expect(issues.map((issue) => `${issue.id}.${issue.field}`)).toEqual([
      'fixture-a.businessLines',
      'fixture-b.businessLines',
    ]);
  });

  it('중복 taxonomy key를 찾는다', () => {
    const issues = checkIntegrity({
      ...empty,
      taxonomies: [termEntry('type', 'si'), termEntry('type', 'si'), termEntry('industry', 'si')],
    });
    expect(issues).toEqual([expect.objectContaining({ collection: 'taxonomies', id: 'type:si' })]);
  });
});

describe('compareCounts', () => {
  it('기존 사이트 건수와 일치하면 차이가 없다', () => {
    expect(compareCounts({ business: 4, projects: 57, news: 8, team: 6, partners: 67 })).toEqual([]);
  });

  it('누락된 collection을 보고한다', () => {
    expect(compareCounts({ business: 4, projects: 56, news: 8, team: 6, partners: 0 })).toEqual([
      { collection: 'projects', expected: 57, actual: 56 },
      { collection: 'partners', expected: 67, actual: 0 },
    ]);
  });
});
