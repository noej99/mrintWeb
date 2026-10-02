/**
 * scroll-snap slider 제어 ([data-slider])
 * - 이전/다음 버튼: 한 슬라이드씩 이동, 양 끝에서는 aria-disabled (focus 유지를 위해 disabled 미사용)
 * - 스크롤/스와이프/키보드 focus 이동 시 현재 위치(counter) 동기화
 * - prefers-reduced-motion: 즉시 이동
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const pad = (value: number) => String(value).padStart(2, '0');

for (const root of document.querySelectorAll<HTMLElement>('[data-slider]')) {
  const track = root.querySelector<HTMLElement>('[data-slider-track]');
  const prev = root.querySelector<HTMLButtonElement>('[data-slider-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-slider-next]');
  const current = root.querySelector<HTMLElement>('[data-slider-current]');
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  if (!track || !prev || !next || slides.length === 0) continue;

  const last = slides.length - 1;
  const indexOf = () => Math.min(last, Math.max(0, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));

  let shown = -1;
  const update = () => {
    const index = indexOf();
    if (index === shown) return;
    shown = index;
    if (current) current.textContent = pad(index + 1);
    prev.setAttribute('aria-disabled', String(index === 0));
    next.setAttribute('aria-disabled', String(index === last));
    slides.forEach((slide, i) => slide.toggleAttribute('data-current', i === index));
  };

  const goTo = (index: number) => {
    const target = Math.min(last, Math.max(0, index));
    track.scrollTo({ left: target * track.clientWidth, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  };

  prev.addEventListener('click', () => {
    if (prev.getAttribute('aria-disabled') !== 'true') goTo(indexOf() - 1);
  });
  next.addEventListener('click', () => {
    if (next.getAttribute('aria-disabled') !== 'true') goTo(indexOf() + 1);
  });

  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  track.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    shown = -1;
    schedule();
  });
  update();
}

export {};
