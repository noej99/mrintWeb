/**
 * overlay Header: 첫 화면(viewport 85%)을 지나면 solid로 전환한다. (design/prototype 동작 기준)
 */
const header = document.querySelector<HTMLElement>('[data-header][data-variant="overlay"]');

if (header) {
  let ticking = false;
  const update = () => {
    header.toggleAttribute('data-scrolled', window.scrollY > window.innerHeight * 0.85);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

export {};
