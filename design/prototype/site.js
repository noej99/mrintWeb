(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ACC = [80, 214, 130]; // approx accent rgb for canvas

/* ── Header ── */
const hdr = $('#hdr');
let lastY = 0;
const onScroll = () => {
  const y = scrollY;
  hdr.classList.toggle('solid', y > innerHeight * 0.85);
  hdr.classList.toggle('hide', y > lastY && y > innerHeight && !document.body.classList.contains('menu-open'));
  lastY = y;
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();
$('#burger').onclick = () => document.body.classList.toggle('menu-open');
$$('#mnav a').forEach(a => a.onclick = () => document.body.classList.remove('menu-open'));

/* ── Clock ── */
const clk = $('#clock');
const tick = () => { clk.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Seoul', hour12: false }); };
tick(); setInterval(tick, 1000);

/* ── Hero canvas: lattice of nodes with travelling packets ── */
(function hero() {
  const cv = $('#heroCanvas'), cx = cv.getContext('2d');
  let W, H, dpr, nodes = [], edges = [], packets = [], t0 = performance.now();
  let mx = 0.7, my = 0.5, tmx = 0.7, tmy = 0.5;
  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodes = []; edges = []; packets = [];
    const cols = W < 760 ? 9 : 16, rows = W < 760 ? 14 : 10;
    // isometric-ish grid in 3D space (x,z) with height y
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const hot = Math.random() < 0.14;
      nodes.push({ gx: i / (cols - 1) - 0.5, gz: j / (rows - 1) - 0.5, h: hot ? 0.04 + Math.random() * 0.22 : 0, hot, ph: Math.random() * 6.28, i, j });
    }
    const idx = (i, j) => i * rows + j;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (i < cols - 1) edges.push([idx(i, j), idx(i + 1, j)]);
      if (j < rows - 1) edges.push([idx(i, j), idx(i, j + 1)]);
    }
    for (let k = 0; k < (W < 760 ? 10 : 22); k++) packets.push(newPacket());
  }
  function newPacket() {
    const e = edges[(Math.random() * edges.length) | 0];
    return { e, p: Math.random(), v: 0.004 + Math.random() * 0.01 };
  }
  function proj(n, t) {
    const rot = -0.62 + (mx - 0.5) * 0.25 + Math.sin(t * 0.00005) * 0.05;
    const tilt = 0.9 + (my - 0.5) * 0.12;
    const S = Math.max(W, H) * 1.35;
    const x = n.gx * Math.cos(rot) - n.gz * Math.sin(rot);
    const z = n.gx * Math.sin(rot) + n.gz * Math.cos(rot);
    const wave = Math.sin(n.gx * 6 + t * 0.0006) * Math.cos(n.gz * 5 + t * 0.0004) * 0.012;
    const y = -(n.h * (0.85 + 0.15 * Math.sin(t * 0.001 + n.ph))) + wave;
    const persp = 1 / (1.6 + z * 0.9);
    return { x: W * (W < 760 ? 0.5 : 0.66) + x * S * persp, y: H * 0.56 + (z * Math.cos(tilt) * 0.55 + y) * S * persp, s: persp, z };
  }
  function draw(t) {
    mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
    cx.clearRect(0, 0, W, H);
    const P = nodes.map(n => proj(n, t));
    const B = nodes.map(n => n.hot ? proj({ ...n, h: 0 }, t) : null);
    cx.lineWidth = 1;
    for (const [a, b] of edges) {
      const pa = P[a], pb = P[b];
      const al = Math.max(0, Math.min(0.16, 0.2 - (pa.z + 0.5) * 0.12));
      cx.strokeStyle = `rgba(244,244,241,${al})`;
      cx.beginPath(); cx.moveTo(pa.x, pa.y); cx.lineTo(pb.x, pb.y); cx.stroke();
    }
    // pillars
    nodes.forEach((n, k) => {
      if (!n.hot) return;
      const p = P[k], b = B[k];
      const g = cx.createLinearGradient(0, b.y, 0, p.y);
      g.addColorStop(0, `rgba(${ACC},0)`); g.addColorStop(1, `rgba(${ACC},.55)`);
      cx.strokeStyle = g; cx.lineWidth = 1;
      cx.beginPath(); cx.moveTo(b.x, b.y); cx.lineTo(p.x, p.y); cx.stroke();
      cx.fillStyle = `rgba(${ACC},.95)`;
      const r = 2.2 * p.s * 1.6;
      cx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    });
    // nodes
    nodes.forEach((n, k) => {
      if (n.hot) return;
      const p = P[k];
      cx.fillStyle = `rgba(244,244,241,${0.18 + p.s * 0.2})`;
      cx.fillRect(p.x - 1, p.y - 1, 2, 2);
    });
    // packets
    for (const pk of packets) {
      pk.p += reduce ? 0 : pk.v;
      if (pk.p >= 1) { Object.assign(pk, newPacket(), { p: 0 }); }
      const a = P[pk.e[0]], b = P[pk.e[1]];
      const x = a.x + (b.x - a.x) * pk.p, y = a.y + (b.y - a.y) * pk.p;
      const tx = a.x + (b.x - a.x) * Math.max(0, pk.p - 0.35), ty = a.y + (b.y - a.y) * Math.max(0, pk.p - 0.35);
      const g = cx.createLinearGradient(tx, ty, x, y);
      g.addColorStop(0, `rgba(${ACC},0)`); g.addColorStop(1, `rgba(${ACC},.9)`);
      cx.strokeStyle = g; cx.lineWidth = 1.5;
      cx.beginPath(); cx.moveTo(tx, ty); cx.lineTo(x, y); cx.stroke();
    }
  }
  let running = true;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) loop(); }).observe(cv);
  function loop(t = performance.now()) { draw(reduce ? 0 : t - t0); if (running && !reduce) requestAnimationFrame(loop); }
  addEventListener('mousemove', e => { tmx = e.clientX / innerWidth; tmy = e.clientY / innerHeight; }, { passive: true });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduce) draw(0); }, 150); });
  build(); loop();
  requestAnimationFrame(() => setTimeout(() => $('.hero').classList.add('in'), 120));
})();

/* ── Tech canvas: orbital precision rings ── */
(function tech() {
  const cv = $('#techCanvas'), cx = cv.getContext('2d');
  let W, H, dpr, pts = [];
  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = [];
    const N = 900;
    for (let i = 0; i < N; i++) { // fibonacci sphere
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
  }
  function draw(t) {
    cx.clearRect(0, 0, W, H);
    const R = Math.min(W, H) * 0.34, ox = W / 2, oy = H / 2;
    const a = t * 0.00012, tilt = 0.42;
    // rings
    const rings = [[1.28, 0.2, 1], [1.46, -0.5, 0.6], [1.12, 1.1, 0.45]];
    rings.forEach(([rr, inc, al], ri) => {
      cx.strokeStyle = `rgba(244,244,241,${0.1 * al + 0.04})`; cx.lineWidth = 1;
      cx.beginPath();
      for (let k = 0; k <= 120; k++) {
        const th = k / 120 * Math.PI * 2;
        let x = Math.cos(th) * rr, y = 0, z = Math.sin(th) * rr;
        const y2 = y * Math.cos(inc) - z * Math.sin(inc), z2 = y * Math.sin(inc) + z * Math.cos(inc);
        const px = ox + x * R, py = oy + (y2 * Math.cos(tilt) - z2 * Math.sin(tilt) * 0.35) * R;
        k ? cx.lineTo(px, py) : cx.moveTo(px, py);
      }
      cx.stroke();
      // satellite
      const th = t * 0.0004 * (ri % 2 ? -1 : 1) + ri * 2;
      let x = Math.cos(th) * rr, z = Math.sin(th) * rr;
      const y2 = -z * Math.sin(inc), z2 = z * Math.cos(inc);
      const px = ox + x * R, py = oy + (y2 * Math.cos(tilt) - z2 * Math.sin(tilt) * 0.35) * R;
      cx.fillStyle = ri === 0 ? `rgb(${ACC})` : 'rgba(244,244,241,.9)';
      cx.fillRect(px - 3, py - 3, 6, 6);
    });
    // sphere points
    for (const [x0, y0, z0] of pts) {
      let x = x0 * Math.cos(a) - z0 * Math.sin(a), z = x0 * Math.sin(a) + z0 * Math.cos(a), y = y0;
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      const d = (z2 + 1) / 2; // 0 back .. 1 front
      const band = Math.abs(y0) < 0.05 || Math.abs(Math.atan2(z0, x0) % 0.785) < 0.02;
      if (band && d > 0.3) cx.fillStyle = `rgba(${ACC},${0.3 + d * 0.7})`;
      else cx.fillStyle = `rgba(244,244,241,${0.06 + d * 0.5})`;
      const s = 0.8 + d * 1.4;
      cx.fillRect(ox + x * R - s / 2, oy + y2 * R - s / 2, s, s);
    }
    // crosshair
    cx.strokeStyle = 'rgba(244,244,241,.12)';
    cx.beginPath(); cx.moveTo(ox - R * 1.6, oy); cx.lineTo(ox - R * 1.2, oy); cx.moveTo(ox + R * 1.2, oy); cx.lineTo(ox + R * 1.6, oy);
    cx.moveTo(ox, oy - R * 1.45); cx.lineTo(ox, oy - R * 1.15); cx.moveTo(ox, oy + R * 1.15); cx.lineTo(ox, oy + R * 1.45); cx.stroke();
    cx.font = '10px "JetBrains Mono", monospace'; cx.fillStyle = 'rgba(140,151,146,.9)';
    cx.fillText('LAT ' + (Math.sin(a) * 90).toFixed(3), ox + R * 1.2, oy - 8);
    cx.fillText('SYNC 100.000%', ox - R * 1.6, oy + 16);
  }
  let running = false, t0 = performance.now();
  new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) loop(); }).observe(cv);
  function loop(t = performance.now()) { draw(reduce ? 0 : t - t0); if (running && !reduce) requestAnimationFrame(loop); }
  addEventListener('resize', () => { build(); draw(performance.now() - t0); });
  build(); draw(0);
})();

/* ── Projects (공개 사업실적 기준) ── */
const PROJECTS = [
  ['2026', '농협은행 NEO 계정계 차세대 구축 / 외국환 개선', '은행', 'SI'],
  ['2026', '흥국화재 IT 어플리케이션 유지보수', '보험', 'ITO'],
  ['2026', '한국투자저축은행 ‘계정·채널 통합관리’ 정보시스템 유지보수', '저축은행', 'ITO'],
  ['2025', 'SC제일은행 신용대출 신청화면 신설 프로젝트', '은행', 'SI'],
  ['2025', 'SC제일은행 펀드 프로세스개선 _ Peer Review Action 이행', '은행', 'SI'],
  ['2025', 'SC제일은행 집중도 프로세스 도입', '은행', 'SI'],
  ['2025', 'SC제일은행 햇살론 119 전문 개발 프로젝트', '은행', 'SI'],
  ['2025', 'SC제일은행 상생 보증부 대출 전문 개발 프로젝트', '은행', 'SI'],
  ['2025', '경동나비엔 영국법인 상담시스템 DB암호화 솔루션 공급', '기타', 'Solution'],
  ['2025', '경동나비엔 파트너포탈 DB암호화 솔루션 공급', '기타', 'Solution'],
  ['2025', '경동나비엔 중국 CIC DB암호화 솔루션 공급', '기타', 'Solution'],
  ['2025', '경동나비엔 Next나비엔 DB 암호화', '기타', 'Solution'],
  ['2025', 'KDB캐피탈 차세대 (인프라 구축)', '기타 금융', 'SI'],
  ['2024', '애큐온저축은행 채널 운영', '저축은행', 'ITO'],
  ['2024', '티알엔 정보시스템 운영 용역 (TAS)', '서비스', 'ITO'],
  ['2024', 'BNK캐피탈 영업지원시스템 화면(UI/UX) 전환 사업', '기타 금융', 'SI'],
  ['2024', '라이나손해보험 어플리케이션 유지보수', '보험', 'ITO'],
  ['2024', '태광그룹 11개 계열사 홈페이지 운영', '기타', 'ITO'],
  ['2024', '현대카드 채널계 / 처리계 유지보수 운영', '기타 금융', 'ITO'],
  ['2024', 'IBK기업은행 정보시스템 운영', '은행', 'ITO'],
  ['2024', '흥국생명 IT 어플리케이션 유지보수', '보험', 'ITO'],
];
const cats = ['전체', 'SI', 'ITO', 'Solution'];
let cur = '전체', expanded = false;
const LIMIT = 8;
const fwrap = $('#filters');
cats.forEach(c => {
  const b = document.createElement('button');
  const n = c === '전체' ? PROJECTS.length : PROJECTS.filter(p => p[3] === c).length;
  b.innerHTML = `${c}<sup>${String(n).padStart(2, '0')}</sup>`;
  b.onclick = () => { cur = c; expanded = false; render(); };
  b.dataset.c = c; fwrap.appendChild(b);
});
const plist = $('#plist'), moreBtn = $('#moreBtn');
function render() {
  $$('#filters button').forEach(b => b.classList.toggle('on', b.dataset.c === cur));
  const list = PROJECTS.filter(p => cur === '전체' || p[3] === cur);
  const shown = expanded ? list : list.slice(0, LIMIT);
  plist.innerHTML = shown.map(([y, t, i, c]) =>
    `<li class="prow"><span class="yr">${y}</span><span class="tt">${t}</span><span class="ind">${i}</span><span class="cat" data-c="${c}">${c}</span><span class="go"></span></li>`).join('');
  $('#projCount').textContent = `${String(shown.length).padStart(2, '0')} / ${String(list.length).padStart(2, '0')} PROJECTS`;
  moreBtn.parentElement.style.display = list.length > LIMIT ? '' : 'none';
  moreBtn.firstChild.textContent = expanded ? '접기 ' : '전체 실적 보기 ';
}
moreBtn.onclick = () => { expanded = !expanded; render(); };
render();

/* viz — industry breakdown */
const inds = {};
PROJECTS.forEach(p => { const k = p[2] === '기타' || p[2] === '서비스' ? '제조·서비스' : p[2]; inds[k] = (inds[k] || 0) + 1; });
const order = ['은행', '보험', '저축은행', '기타 금융', '제조·서비스'];
const cols = ['#0A110F', '#3C4843', '#7A8680', 'oklch(0.52 0.13 152)', 'oklch(0.74 0.17 152)'];
$('#vizBar').innerHTML = order.map((k, i) => `<i style="flex:${inds[k] || 0};background:${cols[i]};transition-delay:${i * 0.08}s"></i>`).join('');
$('#vizLegend').innerHTML = order.map((k, i) => `<div><i style="background:${cols[i]}"></i>${k}<b>${inds[k] || 0}</b></div>`).join('');
$('#vizNote').textContent = `N = ${PROJECTS.length} · 2024–2026`;

/* marquee clients (공개 자료 게재 고객사) */
const c1 = ['농협은행', 'IBK기업은행', 'SC제일은행', '흥국생명', '흥국화재', '현대카드', '라이나손해보험', 'KDB캐피탈'];
const c2 = ['현대차증권', 'SBI저축은행', '한국투자저축은행', '애큐온저축은행', '애큐온캐피탈', 'BNK캐피탈', '태광그룹', '경동나비엔'];
const fill = (el, arr) => { const h = arr.map(n => `<span>${n}</span>`).join(''); el.innerHTML = h + h; };
fill($('#mq1'), c1); fill($('#mq2'), c2);

/* ── Reveal + counters ── */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('on'); io.unobserve(e.target);
}), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
$$('.rv, #cycle, #viz').forEach(el => io.observe(el));

const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 1400;
  const step = t => { const k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = String(v).padStart(2, '0'); if (k < 1) requestAnimationFrame(step); };
  reduce ? el.textContent = String(to).padStart(2, '0') : requestAnimationFrame(step);
  cio.unobserve(el);
}), { threshold: 0.5 });
$$('[data-count]').forEach(el => cio.observe(el));
})();
