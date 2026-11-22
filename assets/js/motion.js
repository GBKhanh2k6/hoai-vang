/* Chuyển động GSAP. Nội dung luôn hiển thị sẵn: nếu thiếu GSAP hoặc người dùng
   bật "giảm chuyển động", trang vẫn đọc và dùng được bình thường. */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.SplitText) gsap.registerPlugin(SplitText);

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const mm = gsap.matchMedia();
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pane = (host) => {
    const p = document.createElement('i');
    p.className = 'pane';
    p.setAttribute('aria-hidden', 'true');
    host.append(p);
    return p;
  };

  // Căn tâm bằng phần trăm để trống không lệch khi đổi cỡ cửa sổ.
  gsap.set('.drum', { xPercent: -50, yPercent: -50, x: 0, y: 0, translate: 'none' });

  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } });

  /* Hero trang chủ */
  const hero = $('.hero');
  if (hero) {
    gsap.timeline({ delay: .05, defaults: { ease: 'power3.out' } })
      .from('.hero__drum', { scale: .55, rotation: -50, opacity: 0, duration: 2 })
      .from('.hero__cloud--l', { xPercent: -90, opacity: 0, duration: 1.6 }, .2)
      .from('.hero__cloud--r', { xPercent: 90, opacity: 0, duration: 1.6 }, .2)
      .from('.hero > .waves', { yPercent: 100, duration: 1.3 }, .2)
      .from('.hero__logo', { y: -18, opacity: 0, duration: .8 }, .4)
      .fromTo('.hero__title img', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'power2.inOut' }, .45)
      .fromTo('.hero__slogan', { clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)', duration: 1 }, 1.1)
      .from('.hero__pedestal', { scale: .7, opacity: 0, duration: 1 }, .9)
      .from('.hero__figure', { opacity: 0, y: -14, duration: 1.2 }, 1.2)
      .from('.hero__note--l', { rotationY: 88, transformPerspective: 900, transformOrigin: 'left center', duration: 1.3 }, 1)
      .from('.hero__note--r', { rotationY: -88, transformPerspective: 900, transformOrigin: 'right center', duration: 1.3 }, 1.15);
    $$('.hero__card').forEach((card, i) => {
      gsap.fromTo(pane(card), { left: '-55%' }, { left: '130%', duration: 1.8, ease: 'power2.inOut', delay: 2.4 + i * .35, repeat: -1, repeatDelay: 5 });
    });

    gsap.fromTo(pane($('.hero__title')), { left: '-55%' }, { left: '125%', duration: 2.3, ease: 'power2.inOut', delay: 1.5, repeat: -1, repeatDelay: 4.5 });

    const random = gsap.utils.random;
    for (let i = 0; i < 9; i++) {
      const sheet = document.createElement('i');
      sheet.className = 'paper';
      hero.append(sheet);
      gsap.set(sheet, { left: `${random(4, 92)}%`, top: `${random(14, 74)}%`, scale: random(.4, 1.15), rotation: random(-60, 60) });
      gsap.to(sheet, { x: random(-70, 70), y: random(-50, 50), rotationY: random(-70, 70), rotation: '+=35', duration: random(5, 9), repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }

    const out = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 }, defaults: { ease: 'none' } });
    out.to('.hero__content', { y: () => (innerWidth > 820 ? 150 : 0) }, 0)
      .to('.hero__cloud--l', { x: -160 }, 0)
      .to('.hero__cloud--r', { x: 160 }, 0);
  }

  /* Đầu trang trong */
  const head = $('.page-hero');
  if (head) {
    gsap.from($('.drum', head), { scale: .7, opacity: 0, duration: 1.8, ease: 'power3.out' });
    const wordmark = $('.wordmark img', head);
    if (wordmark) gsap.fromTo(wordmark, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.4, delay: .25, ease: 'power2.inOut' });
    gsap.fromTo($('.drum', head), { rotation: 0 }, { rotation: 45, ease: 'none', scrollTrigger: { trigger: head, start: 'top top', end: 'bottom top', scrub: 1 } });
  }

  /* Hành trình cuộn ngang, trống xoay theo */
  const journey = $('.journey');
  if (journey) {
    mm.add('(min-width: 821px) and (min-height: 561px)', () => {
      const track = $('.journey__track', journey);
      journey.classList.add('is-pinned');
      track.scrollLeft = 0;
      const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      gsap.timeline({ scrollTrigger: { trigger: journey, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: .8, invalidateOnRefresh: true }, defaults: { ease: 'none' } })
        .to(track, { x: () => -distance() }, 0)
        .to('.journey__drum', { rotation: 150 }, 0);
      // Phím Tab: cuộn trang tới đúng chương đang được chọn
      const focus = (e) => {
        if (!e.target.matches(':focus-visible')) return;
        journey.scrollLeft = 0;
        const pin = ScrollTrigger.getAll().find((t) => t.pin === journey);
        if (pin) scrollTo(0, pin.start + (pin.end - pin.start) * Math.min(1, e.target.offsetLeft / (distance() || 1)));
      };
      track.addEventListener('focusin', focus);
      return () => {
        track.removeEventListener('focusin', focus);
        journey.classList.remove('is-pinned');
      };
    });
  }

  /* Trống đồng đánh dấu từng phần chương trình */
  const wheel = $('.wheel');
  if (wheel) {
    const number = $('b', wheel), label = $('.wheel__core span', wheel), drum = $('.drum', wheel);
    $$('.step').forEach((step, i) => {
      const activate = () => {
        number.textContent = i + 1;
        label.textContent = step.dataset.name;
        gsap.to(drum, { rotation: i * 360 / 7, duration: 1.1, ease: 'power3.out', overwrite: 'auto' });
      };
      ScrollTrigger.create({ trigger: step, start: 'top 55%', end: 'bottom 55%', onEnter: activate, onEnterBack: activate });
    });
  }

  /* Chữ hiện theo từng từ; chờ font để không lệch dấu tiếng Việt */
  document.fonts.ready.then(() => {
    if (window.SplitText) {
      $$('[data-split]').forEach((node) => {
        const split = SplitText.create(node, { type: 'words', tag: 'span', aria: 'none' });
        gsap.from(split.words, { yPercent: 55, opacity: 0, rotationX: -60, stagger: .045, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: node, start: 'top 88%', once: true } });
      });
    }
    ScrollTrigger.refresh();
  });

  /* Lời mở: từng chữ sáng dần theo tay cuộn */
  const lightLine = $('[data-light]');
  if (lightLine && window.SplitText) {
    document.fonts.ready.then(() => {
      const split = SplitText.create(lightLine, { type: 'words', tag: 'span', aria: 'none' });
      gsap.fromTo(split.words, { opacity: .16 }, {
        opacity: 1, stagger: .12, ease: 'none',
        scrollTrigger: { trigger: '.opening', start: 'top 70%', end: 'bottom 90%', scrub: .3 },
      });
    });
  }

  /* Trải nghiệm: thẻ trước lùi lại khi thẻ sau xếp chồng lên */
  const deck = $$('.deck__item');
  deck.slice(0, -1).forEach((item, i) => {
    gsap.to($('.deck__card', item), {
      scale: .93, ease: 'none',
      scrollTrigger: { trigger: deck[i + 1], start: 'top bottom', end: 'top top+=140', scrub: true },
    });
  });

  $$('.frame').forEach((frame) => {
    gsap.fromTo(pane(frame), { left: '-55%' }, { left: '130%', duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: frame, start: 'top 85%', once: true } });
  });

  const letter = $('.letter');
  if (letter) gsap.from(letter, { rotationX: -38, scale: .9, ease: 'none', scrollTrigger: { trigger: '.envelope', start: 'top bottom', end: 'top 25%', scrub: .6 } });

  /* Ánh kính theo con trỏ và thẻ nghiêng */
  if (finePointer) {
    document.addEventListener('pointermove', (e) => {
      const glass = e.target.closest?.('.glass');
      if (!glass) return;
      const r = glass.getBoundingClientRect();
      glass.style.setProperty('--mx', `${e.clientX - r.left}px`);
      glass.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });

    $$('[data-tilt]').forEach((card) => {
      gsap.set(card, { transformPerspective: 800 });
      const rx = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power2.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power2.out' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        rx(-((e.clientY - r.top) / r.height - .5) * 10);
        ry(((e.clientX - r.left) / r.width - .5) * 12);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* Cánh hoa bung khi bấm nút */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('button.btn, .tile, [data-strike]') || e.target.closest('dialog') || (!e.clientX && !e.clientY)) return;
    for (let i = 0; i < 9; i++) {
      const petal = document.createElement('i');
      petal.className = 'petal';
      document.body.append(petal);
      const angle = (i / 9) * Math.PI * 2;
      gsap.fromTo(petal, { x: e.clientX, y: e.clientY, opacity: 1 }, {
        x: e.clientX + Math.cos(angle) * 70, y: e.clientY + Math.sin(angle) * 55 + 25,
        rotation: 160, opacity: 0, duration: .9, ease: 'power2.out', onComplete: () => petal.remove(),
      });
    }
  });

  /* Hero: cánh hoa rơi, tượng theo chuột, mây dâng khép vào nền đỏ */
  if (hero) {
    const random = gsap.utils.random;
    const falling = [];
    for (let i = 0; i < (finePointer ? 14 : 7); i++) {
      const petal = document.createElement('i');
      petal.className = 'petal';
      petal.setAttribute('aria-hidden', 'true');
      petal.style.left = `${random(2, 98)}%`;
      hero.append(petal);
      falling.push(gsap.fromTo(petal, { y: 0, x: 0, rotation: 0 }, {
        y: () => hero.offsetHeight + 40, x: random(-120, 120), rotation: random(180, 540),
        duration: random(9, 17), delay: random(0, 6), repeat: -1, ease: 'none',
      }));
    }
    ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: (self) => falling.forEach((t) => t.paused(!self.isActive)) });

    mm.add('(min-width: 821px)', () => {
      gsap.fromTo('.hero > .waves', { y: 0 }, {
        y: () => -hero.offsetHeight * .42, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .7, invalidateOnRefresh: true },
      });
      if (!finePointer) return undefined;
      const figureX = gsap.quickTo('.hero__stage', 'x', { duration: .8, ease: 'power3' });
      const follow = (e) => figureX((e.clientX / innerWidth - .5) * 22);
      hero.addEventListener('pointermove', follow);
      return () => hero.removeEventListener('pointermove', follow);
    });
  }

  /* Ban tổ chức: ảnh mở như rèm, sáu thẻ lật vào */
  const crew = $('.crew');
  if (crew) {
    gsap.fromTo('.crew__photo', { clipPath: 'inset(10% 10% 10% 10% round 22px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.2, ease: 'power3.out', clearProps: 'clipPath',
      scrollTrigger: { trigger: crew, start: 'top 88%', once: true },
    });
    gsap.from($$('.crew__list > li', crew), {
      y: 50, rotationY: -35, opacity: 0, duration: 1, stagger: .09, ease: 'power3.out', clearProps: 'all',
      scrollTrigger: { trigger: $('.crew__list', crew), start: 'top 92%', once: true },
    });
    const shine = pane($('.crew__photo', crew));
    gsap.fromTo(shine, { left: '-55%' }, { left: '130%', duration: 1.7, ease: 'power2.inOut', scrollTrigger: { trigger: crew, start: 'top 70%', once: true } });
  }

  /* Hai dải ảnh trượt thêm theo tay cuộn */
  $$('.marquee__shift').forEach((row, i) => {
    gsap.fromTo(row, { x: i ? -140 : 140 }, { x: i ? 140 : -140, ease: 'none', scrollTrigger: { trigger: '.ribbons', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });

  /* Nút hút theo chuột */
  if (finePointer) {
    $$('.btn').forEach((btn) => {
      if (btn.closest('dialog')) return;
      const x = gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3' });
      const y = gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .18);
        y((e.clientY - r.top - r.height / 2) * .25);
      });
      btn.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  ScrollTrigger.sort();
  addEventListener('load', () => ScrollTrigger.refresh());
})();
