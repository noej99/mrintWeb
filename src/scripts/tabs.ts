/**
 * 접근 가능한 탭 ([data-tabs]) — WAI-ARIA APG Tabs (자동 활성화)
 * - 서버 렌더링 결과는 모든 패널이 보이는 상태 (JS 미동작 fallback)
 * - 초기화 시: tablist 표시, 패널에 role=tabpanel/aria-labelledby/tabindex=0, 패널 h3 hidden, 선택 외 패널 hidden
 * - 키보드: ←/→ 이전/다음(순환), Home/End 처음/끝, roving tabindex
 */
for (const root of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
  const list = root.querySelector<HTMLElement>('[data-tabs-list]');
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-tab]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls') ?? ''));
  if (!list || tabs.length === 0 || panels.some((panel) => !panel)) continue;

  const select = (index: number, focus: boolean) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i]!.hidden = !selected;
    });
    if (focus) tabs[index]!.focus();
  };

  panels.forEach((panel, i) => {
    panel!.setAttribute('role', 'tabpanel');
    panel!.setAttribute('aria-labelledby', tabs[i]!.id);
    panel!.tabIndex = 0;
    const heading = panel!.querySelector<HTMLElement>('[data-tab-heading]');
    if (heading) heading.hidden = true;
  });

  const initial = Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'));
  select(initial, false);
  list.hidden = false;

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index, false));
    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      const next: Record<string, number> = {
        ArrowRight: index === last ? 0 : index + 1,
        ArrowLeft: index === 0 ? last : index - 1,
        Home: 0,
        End: last,
      };
      const target = next[event.key];
      if (target === undefined) return;
      event.preventDefault();
      select(target, true);
    });
  });

  root.dataset.ready = '';
}

export {};
