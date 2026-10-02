import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** 검사 기준: WCAG 2.2 AA까지 (docs/requirements.md §13) */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export interface A11yOptions {
  /** 검사 범위를 특정 selector로 제한 */
  include?: string;
  /** 검사에서 제외할 selector (예: 외부 지도 iframe) */
  exclude?: string[];
}

type Violations = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];

function formatViolations(violations: Violations): string {
  return violations
    .map((v) => {
      const targets = v.nodes.map((node) => `    - ${node.target.join(' ')}`).join('\n');
      return `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n${targets}`;
    })
    .join('\n\n');
}

/** 현재 페이지에 axe-core 위반이 없는지 검사한다. */
export async function expectNoA11yViolations(page: Page, options: A11yOptions = {}): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (options.include) builder = builder.include(options.include);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);

  const { violations } = await builder.analyze();
  expect(violations, formatViolations(violations)).toEqual([]);
}
