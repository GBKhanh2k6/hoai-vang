/* Mặt trống đồng vẽ bằng SVG theo bố cục vành đồng tâm:
   sao 14 cánh, hồi văn, người múa đội lông chim, nhà sàn, hươu, chim Lạc, răng cưa.
   Ba lớp SVG tách rời để mỗi lớp xoay bằng GPU, không phải vẽ lại. */
(() => {
  const TAU = Math.PI * 2;
  const fix = (n) => n.toFixed(1);
  const polar = (r, a) => `${fix(Math.sin(a) * r)} ${fix(-Math.cos(a) * r)}`;
  const circle = (r, w = 1.5) => `<circle r="${r}" stroke-width="${w}"/>`;
  const around = (count, radius, shape, offset = 0) => Array.from({ length: count }, (_, i) =>
    `<g transform="rotate(${fix((i + offset) * 360 / count)}) translate(0 -${radius})">${typeof shape === 'function' ? shape(i) : shape}</g>`).join('');

  const teeth = (count, inner, outer) => {
    let d = '';
    for (let i = 0; i < count; i++) {
      d += `M${polar(inner, i / count * TAU)}L${polar(outer, (i + .5) / count * TAU)}L${polar(inner, (i + 1) / count * TAU)}Z`;
    }
    return `<path d="${d}" fill="currentColor" stroke="none"/>`;
  };
  const dotted = (count, r) => around(count, r, '<circle r="5" stroke-width="1.3"/><circle r="1.6" fill="currentColor" stroke="none"/>');

  const bird = `<g fill="currentColor" stroke-width="1.2">
    <path d="M-58-6L-29-9C-25-15-18-16-13-11L-3-4C10-5 20-2 27 1L56-5L60 1L54 7L27 6C15 11 2 10-8 5L-20-3Z"/>
    <path d="M-20-13C-14-25-4-28 10-27L0-22L13-21L-4-17L-12-12Z"/>
    <path d="M-5-3L18-25L38-28L29-21L34-19L21-14L25-11L14-2Z"/>
    <path d="M3 8L24 24L40 25L31 19L34 17L23 12L25 9L14 5Z"/></g>`;
  const dancer = `<g stroke-width="2.6" stroke-linecap="round">
    <path d="M-2-9L-14-30M0-10L-4-34M2-10L7-34M4-8L17-28"/>
    <circle cx="1" cy="-5" r="4.5" fill="currentColor"/>
    <path d="M1 0L-7 20L9 20ZM0 4L-14 8L-18-2M1 4L15 6L20-5M-4 21L-9 31M5 21L10 31"/></g>`;
  const house = `<g stroke-width="2.2">
    <path d="M-30-24C-18-12 18-12 30-24C25-7 21-5 18-2H-18C-21-5-25-7-30-24Z" fill="currentColor"/>
    <path d="M-17-2V28M17-2V28M-23 17H23M-8 0V16M0 0V16M8 0V16M-30-24L-36-31M30-24L36-31"/></g>`;
  const deer = `<g stroke-width="2.2" stroke-linecap="round">
    <path d="M-18 2C-6-3 8-3 17 1L20-10L30-8L22-4L21 8C8 11-7 11-18 8Z" fill="currentColor"/>
    <path d="M-15 8L-19 23M-8 9L-7 23M12 9L10 23M18 8L24 22M20-11L13-25M22-11L28-26M16-19L9-21M25-20L34-21M-18 3L-24-3"/></g>`;
  const meander = '<path d="M-17 9H-7V-7H8V4H1V-2M17-9H12V10H-2" stroke-width="2"/>';

  const outer = circle(496, 3) + circle(489) + dotted(116, 478) + circle(467) + teeth(150, 444, 464) + circle(442, 2.5)
    + circle(436) + around(26, 400, bird) + circle(366, 2.5) + circle(360) + teeth(112, 340, 357) + circle(338);
  const middle = circle(332, 2.5) + around(44, 315, meander) + circle(298) + circle(293)
    + around(24, 256, (i) => (i % 6 === 0 ? house : i % 6 === 3 ? deer : dancer)) + circle(219, 2.5) + circle(214);

  let rays = '';
  let chevrons = '';
  for (let i = 0; i < 28; i++) rays += `${i ? 'L' : 'M'}${polar(i % 2 ? 44 : 139, i / 28 * TAU)}`;
  for (let i = 0; i < 14; i++) {
    const a = (i + .5) / 14 * TAU;
    for (const r of [90, 106, 122]) chevrons += `M${polar(r + 10, a - .1)}L${polar(r, a)}L${polar(r + 10, a + .1)}`;
  }
  const core = dotted(54, 201) + circle(189) + teeth(64, 168, 186) + circle(166, 2.5) + dotted(44, 156) + circle(145)
    + `<path d="${rays}Z" fill="currentColor" stroke-width="1"/><path d="${chevrons}" stroke-width="2"/>` + circle(28, 3);

  const svg = [outer, middle, core].map((body) =>
    `<svg viewBox="-500 -500 1000 1000" fill="none" stroke="currentColor" aria-hidden="true">${body}</svg>`).join('');
  document.querySelectorAll('.drum').forEach((el) => { el.innerHTML = svg; el.setAttribute('aria-hidden', 'true'); });

  const resting = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-still', !e.isIntersecting)));
  document.querySelectorAll('.drum').forEach((el) => resting.observe(el));

  let audio;
  function boom() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
      const t = audio.currentTime;
      [[128, 1, 1.5], [212, .35, .8], [341, .16, .5]].forEach(([hz, volume, length]) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.setValueAtTime(hz, t);
        osc.frequency.exponentialRampToValueAtTime(hz * .55, t + length);
        gain.gain.setValueAtTime(volume * .6, t);
        gain.gain.exponentialRampToValueAtTime(.001, t + length);
        osc.connect(gain).connect(audio.destination);
        osc.start(t);
        osc.stop(t + length);
      });
    } catch (error) {
      console.warn('Không phát được tiếng trống:', error);
    }
  }

  function strike(drum) {
    boom();
    if (!drum || !drum.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    drum.animate([{ scale: 1 }, { scale: .965, offset: .12 }, { scale: 1.025, offset: .4 }, { scale: 1 }], { duration: 750, easing: 'ease-out' });
    for (let i = 0; i < 4; i++) {
      const ring = document.createElement('i');
      ring.className = 'ripple';
      drum.append(ring);
      ring.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(3)', opacity: 0 }],
        { duration: 1700, delay: i * 170, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }).onfinish = () => ring.remove();
    }
  }
  document.querySelectorAll('[data-strike]').forEach((btn) =>
    btn.addEventListener('click', () => strike(document.querySelector('.drum'))));
})();
