/**
 * MegaMenu disclosure 동작
 * - trigger click(Enter/Space 포함)으로 토글, 한 번에 하나만 열림
 * - ESC: 닫고 trigger로 focus 복귀
 * - 바깥 클릭 / focus가 메뉴 밖으로 이동: 닫힘
 */
const menus = [...document.querySelectorAll<HTMLElement>('[data-mega]')];
const header = document.querySelector<HTMLElement>('[data-header]');

function triggerOf(menu: HTMLElement) {
  return menu.querySelector<HTMLButtonElement>('[data-mega-trigger]');
}

function setOpen(menu: HTMLElement, open: boolean) {
  triggerOf(menu)?.setAttribute('aria-expanded', String(open));
  menu.toggleAttribute('data-open', open);
  header?.toggleAttribute('data-mega-open', menus.some((m) => m.hasAttribute('data-open')));
}

function closeAll(except?: HTMLElement) {
  for (const menu of menus) if (menu !== except && menu.hasAttribute('data-open')) setOpen(menu, false);
}

for (const menu of menus) {
  const trigger = triggerOf(menu);
  if (!trigger) continue;

  trigger.addEventListener('click', () => {
    const open = !menu.hasAttribute('data-open');
    closeAll(menu);
    setOpen(menu, open);
  });

  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.hasAttribute('data-open')) {
      event.preventDefault();
      setOpen(menu, false);
      trigger.focus();
    }
  });

  menu.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !menu.contains(next)) setOpen(menu, false);
  });
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof Node && !menus.some((menu) => menu.contains(target))) closeAll();
});

export {};
