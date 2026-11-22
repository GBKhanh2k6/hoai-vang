/* Thông tin dùng chung, thanh điều hướng và chân trang. Sửa một lần, đổi ở mọi trang. */
(() => {
  const EVENT = {
    time: '15:30 - 16:30',
    date: 'Thứ Bảy ngày 21/11/2026',
    room: 'Phòng A101, 131 Lương Nhữ Hộc, Cẩm Lệ',
    school: 'Trường Đại học Ngoại Ngữ - Đại học Đà Nẵng',
  };
  const PAGES = [
    ['index', 'Trang chủ'],
    ['ban-to-chuc', 'Ban tổ chức'],
    ['gioi-thieu', 'Giới thiệu'],
    ['hanh-trinh', 'Hành trình'],
    ['le-tri-an', 'Lễ tri ân'],
    ['tro-choi', 'Trò chơi'],
    ['workshop', 'Workshop'],
    ['loi-cam-on', 'Lời cảm ơn'],
    ['thu-vien', 'Thư viện'],
  ];
  const current = document.body.dataset.page;
  const links = () => PAGES.map(([id, label]) =>
    `<a href="${id}.html"${id === current ? ' aria-current="page"' : ''}>${label}</a>`).join('');

  document.querySelectorAll('[data-event]').forEach((el) => { el.textContent = EVENT[el.dataset.event]; });

  document.body.insertAdjacentHTML('afterbegin', `
    <a class="skip" href="#main">Đến nội dung chính</a>
    <div class="progress" aria-hidden="true"></div>
    <header class="nav glass">
      <a class="nav__brand" href="index.html" aria-label="Hoài Vãng, về trang chủ">
        <img src="assets/brand/logo.png" alt="Checkmate Group">
        <img src="assets/brand/hoai-vang.png" alt="Hoài Vãng">
      </a>
      <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
      <nav class="nav__links" id="menu" aria-label="Điều hướng chính"><span class="nav__slider" aria-hidden="true"></span>${links()}</nav>
    </header>`);

  document.querySelector('main').insertAdjacentHTML('afterend', `
    <footer class="footer">
      <div class="wrap footer__grid">
        <div class="footer__mark">
          <img src="assets/brand/logo.png" alt="Checkmate Group">
          <img src="assets/brand/hoai-vang.png" alt="Hoài Vãng">
          <img src="assets/brand/slogan.png" alt="Khắc ghi ân nghĩa, trọn đời tri ân.">
        </div>
        <dl class="facts">
          <dt class="badge">Thời gian</dt><dd><strong>${EVENT.time}</strong>${EVENT.date}</dd>
          <dt class="badge">Địa điểm</dt><dd><strong>${EVENT.room}</strong>${EVENT.school}</dd>
        </dl>
        <nav class="footer__links" aria-label="Điều hướng cuối trang">${links()}</nav>
      </div>
      <div class="waves"></div>
    </footer>`);

  const nav = document.querySelector('.nav');
  const toggle = nav.querySelector('.nav__toggle');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.textContent = open ? 'Đóng' : 'Menu';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !nav.classList.contains('is-open')) return;
    setMenu(false);
    toggle.focus();
  });
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) setMenu(false); });

  // Viên kính trượt theo mục đang trỏ, rồi trở về trang hiện tại.
  const slider = nav.querySelector('.nav__slider');
  const items = [...nav.querySelectorAll('.nav__links a')];
  const active = items.find((a) => a.hasAttribute('aria-current')) || items[0];
  const light = (target) => {
    items.forEach((a) => a.classList.toggle('is-lit', a === target));
    slider.style.width = `${target.offsetWidth}px`;
    slider.style.transform = `translateX(${target.offsetLeft}px)`;
  };
  items.forEach((a) => {
    a.addEventListener('pointerenter', () => light(a));
    a.addEventListener('focus', () => light(a));
  });
  nav.querySelector('nav').addEventListener('pointerleave', () => light(active));
  addEventListener('resize', () => light(active));
  document.fonts.ready.then(() => light(active));
  slider.style.transition = 'none';
  light(active);
  slider.getBoundingClientRect();
  slider.style.transition = '';

  let last = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 60);
    if (Math.abs(y - last) < 6) return;
    nav.classList.toggle('is-hidden', y > last && y > 260 && !nav.classList.contains('is-open'));
    last = y;
  }, { passive: true });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
})();
