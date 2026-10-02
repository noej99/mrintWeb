/**
 * MobileMenu 동작 (native dialog)
 * - 열기: showModal() → focus trap, 배경 inert, ESC 닫기는 브라우저가 처리
 * - 닫기: 닫기 버튼, 메뉴 링크 선택, desktop 폭으로 전환
 * - 닫힌 뒤 열기 버튼으로 focus 복귀, aria-expanded 동기화
 */
const dialog = document.querySelector<HTMLDialogElement>('[data-mobile-menu]');
const openButton = document.querySelector<HTMLButtonElement>('[data-mobile-menu-open]');
const closeButton = dialog?.querySelector<HTMLButtonElement>('[data-mobile-menu-close]');

if (dialog && openButton) {
  openButton.addEventListener('click', () => {
    if (dialog.open) return;
    dialog.showModal();
    openButton.setAttribute('aria-expanded', 'true');
  });

  closeButton?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a[href]')) dialog.close();
  });

  dialog.addEventListener('close', () => {
    openButton.setAttribute('aria-expanded', 'false');
    openButton.focus();
  });

  const desktop = window.matchMedia('(min-width: 1101px)');
  desktop.addEventListener('change', (event) => {
    if (event.matches && dialog.open) dialog.close();
  });
}

export {};
