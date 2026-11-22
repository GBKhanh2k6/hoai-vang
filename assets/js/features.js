/* Các khối tương tác: vòng ảnh 3D, dải ảnh, tab, giải từ, bảng điểm, cây tri ân, thư viện, lightbox. */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = (id) => `assets/photos/s/${id}.jpg`;
  const large = (id) => `assets/photos/l/${id}.jpg`;
  const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    },
  };

  /* Vòng ảnh 3D: kéo để xoay */
  $$('[data-ring]').forEach((ring) => {
    const ids = ring.dataset.ring.split(',');
    const spin = el('div', { className: 'ring__spin' });
    ids.forEach((id) => {
      const item = el('figure', { className: 'ring__item' });
      item.append(el('img', { src: small(id), alt: 'Khoảnh khắc trong chương trình Hoài Vãng', draggable: false }));
      spin.append(item);
    });
    ring.append(spin);

    let radius = 0, angle = 0, velocity = 0, dragX = null, visible = false;
    const place = () => {
      const h = ring.clientHeight * .78;
      const w = h * 1.3;
      radius = (w + 16) / 2 / Math.tan(Math.PI / ids.length);
      [...spin.children].forEach((item, i) => {
        Object.assign(item.style, {
          width: `${w}px`, height: `${h}px`, left: `${-w / 2}px`, top: `${-h / 2}px`,
          transform: `rotateY(${i * 360 / ids.length}deg) translateZ(${radius}px)`,
        });
      });
    };
    const draw = () => { spin.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`; };
    let previous = performance.now();
    const loop = (now) => {
      if (!visible) return;
      const dt = Math.min(50, now - previous) / 16.7;
      previous = now;
      if (dragX === null) {
        velocity *= .95 ** dt;
        angle += (velocity + (calm ? 0 : -.07)) * dt;
      }
      draw();
      requestAnimationFrame(loop);
    };
    ring.addEventListener('pointerdown', (e) => { dragX = e.clientX; velocity = 0; ring.setPointerCapture(e.pointerId); });
    ring.addEventListener('pointermove', (e) => {
      if (dragX === null) return;
      velocity = (e.clientX - dragX) * .09;
      angle += velocity;
      dragX = e.clientX;
    });
    const release = () => { dragX = null; };
    ring.addEventListener('pointerup', release);
    ring.addEventListener('pointercancel', release);
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === visible) return;
      visible = entry.isIntersecting;
      if (visible) { previous = performance.now(); requestAnimationFrame(loop); }
    }).observe(ring);
    addEventListener('resize', () => { place(); draw(); });
    place();
    draw();
  });

  /* Dải ảnh chạy: nhân đôi để nối liền */
  $$('[data-marquee]').forEach((row) => {
    const ids = row.dataset.marquee.split(',');
    [...ids, ...ids].forEach((id, i) => {
      const img = el('img', { loading: 'lazy', decoding: 'async', src: small(id), alt: i < ids.length ? 'Khoảnh khắc Hoài Vãng' : '' });
      const ratio = (window.HV_PHOTOS || []).find(([key]) => key === id);
      if (ratio) img.style.aspectRatio = ratio[1];
      const btn = el('button', { type: 'button' });
      btn.dataset.zoom = large(id);
      if (i >= ids.length) { btn.tabIndex = -1; btn.setAttribute('aria-hidden', 'true'); }
      btn.append(img);
      row.append(btn);
    });
  });

  /* Chơi thử giải từ */
  const game = $('[data-scramble]');
  if (game) {
    const words = ['THẦY CÔ', 'TRI ÂN', 'HỌC TRÒ', 'MÁI TRƯỜNG', 'BẢNG ĐEN', 'BIẾT ƠN', 'LÁI ĐÒ', 'GIÁO ÁN', 'PHẤN TRẮNG', 'BÀI GIẢNG', 'SÁCH VỞ', 'TRỒNG NGƯỜI'];
    const tiles = $('.tiles', game), slots = $('.slots', game), status = $('.status', game);
    let index = 0, points = 0, picked = [], solved = false, hinted = 0;
    const letters = () => Array.from(words[index].replace(/ /g, ''));

    const render = () => {
      const answer = letters();
      slots.replaceChildren();
      let at = 0;
      words[index].split(' ').forEach((word) => {
        const group = el('span');
        Array.from(word).forEach(() => {
          const pos = at++;
          const tile = picked[pos];
          const slot = el('button', { type: 'button', className: 'slot', textContent: tile ? tile.textContent : '', disabled: !tile || solved || pos < hinted });
          slot.setAttribute('aria-label', tile ? `Bỏ chữ ${tile.textContent}` : `Ô chữ ${pos + 1}`);
          slot.addEventListener('click', () => {
            picked.splice(pos).forEach((t) => { t.disabled = false; });
            status.textContent = '';
            render();
          });
          group.append(slot);
        });
        slots.append(group);
      });
      $('[data-count]', game).textContent = `Từ ${index + 1}/${words.length}`;
      $('[data-points]', game).textContent = `${points} điểm`;
      if (solved || picked.length < answer.length) return;
      if (picked.map((t) => t.textContent).join('') === answer.join('')) {
        solved = true;
        if (!hinted) points += 10;
        $$('.slot', slots).forEach((s) => { s.disabled = true; });
        $('[data-points]', game).textContent = `${points} điểm`;
        status.textContent = `Chính xác: ${words[index].toLocaleLowerCase('vi')}. ${hinted ? 'Có dùng gợi ý nên không cộng điểm.' : 'Cộng 10 điểm.'}`;
        if (window.gsap && !calm) gsap.from($$('.slot', slots), { y: -24, stagger: .04, duration: .6, ease: 'bounce.out' });
      } else {
        status.textContent = 'Chưa đúng. Bấm vào ô đầu tiên bị sai để xếp lại.';
      }
    };
    const pick = (tile) => {
      if (solved || tile.disabled) return;
      picked.push(tile);
      tile.disabled = true;
      render();
    };
    const load = () => {
      picked = []; solved = false; hinted = 0; status.textContent = '';
      const answer = letters();
      let mixed;
      do { mixed = answer.map((c) => [Math.random(), c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); } while (mixed.join('') === answer.join(''));
      tiles.replaceChildren(...mixed.map((char) => {
        const tile = el('button', { type: 'button', className: 'tile', textContent: char });
        tile.addEventListener('click', () => pick(tile));
        return tile;
      }));
      render();
    };
    $('[data-hint]', game).addEventListener('click', () => {
      if (solved) return;
      const answer = letters();
      let good = 0;
      while (picked[good] && picked[good].textContent === answer[good]) good++;
      picked.splice(good).forEach((t) => { t.disabled = false; });
      const tile = $$('.tile', tiles).find((t) => !t.disabled && t.textContent === answer[good]);
      hinted = good + 1;
      status.textContent = '';
      if (tile) pick(tile);
    });
    $('[data-next]', game).addEventListener('click', () => {
      index = (index + 1) % words.length;
      const total = points;
      if (!index) points = 0;
      load();
      if (!index) status.textContent = `Hết bộ từ, bạn đạt ${total} điểm. Bắt đầu lại từ đầu.`;
    });
    load();
  }

  /* Bảng điểm */
  const board = $('[data-board]');
  if (board) {
    const teams = ['Lục Sắc', 'Mucha', 'Cá Sấu Đội Mũ', 'Đom Đóm'];
    let scores = store.get('hv-scores', [0, 0, 0, 0]);
    if (!Array.isArray(scores) || scores.length !== teams.length) scores = [0, 0, 0, 0];
    const outputs = [];
    const update = (i) => { outputs[i].textContent = scores[i]; store.set('hv-scores', scores); };
    teams.forEach((name, i) => {
      const card = el('article', { className: 'score glass' });
      const output = el('output', { textContent: scores[i] });
      const buttons = el('div', { className: 'score__btns' });
      [10, 20, 30, -10].forEach((n) => {
        const b = el('button', { type: 'button', textContent: `${n > 0 ? '+' : '−'}${Math.abs(n)}` });
        b.setAttribute('aria-label', `${n > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(n)} điểm cho đội ${name}`);
        b.addEventListener('click', () => { scores[i] = Math.max(0, scores[i] + n); update(i); });
        buttons.append(b);
      });
      card.append(el('h3', { className: 'subtitle', textContent: name }), output, buttons);
      board.append(card);
      outputs.push(output);
    });
    $('[data-board-reset]').addEventListener('click', () => {
      if (!confirm('Đưa điểm của cả bốn đội về 0?')) return;
      scores = teams.map(() => 0);
      teams.forEach((_, i) => update(i));
    });
  }

  /* Cây tri ân */
  const tree = $('[data-tree]');
  if (tree) {
    const spots = [[50,20],[35,24],[65,25],[23,34],[78,34],[43,33],[58,36],[14,46],[88,46],[30,44],[70,46],[50,46],[20,57],[81,58],[35,56],[65,57],[43,12],[60,11],[25,17],[76,17],[10,32],[91,30],[10,62],[92,64]];
    const form = $('[data-leaf-form]'), note = $('.status', form), reader = $('.leaf-read', form);
    let leaves = store.get('hv-leaves', []);
    if (!Array.isArray(leaves)) leaves = [];
    const paint = (fresh = -1) => {
      $$('.leaf', tree).forEach((leaf) => leaf.remove());
      spots.forEach(([x, y], i) => {
        const data = leaves[i];
        const leaf = data
          ? el('button', { type: 'button', className: 'leaf', textContent: data.to })
          : el('i', { className: 'leaf leaf--empty' });
        Object.assign(leaf.style, { left: `${x}%`, top: `${y}%`, rotate: `${((i * 47) % 50 - 25) * (data ? .4 : 1)}deg`, background: data ? data.color : ['#2aa198', '#e3a33b', '#8f1529'][i % 3] });
        if (data) {
          leaf.addEventListener('click', () => { reader.hidden = false; reader.textContent = `Gửi ${data.to}: ${data.text}`; });
        }
        tree.append(leaf);
        if (i === fresh && window.gsap && !calm) gsap.from(leaf, { scale: 0, rotation: 200, y: 120, duration: 1.2, ease: 'back.out(1.5)' });
      });
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const to = form.elements.to.value.trim(), text = form.elements.text.value.trim();
      if (!to || !text) { note.textContent = 'Hãy điền tên người nhận và lời nhắn.'; return; }
      if (leaves.length >= spots.length) { note.textContent = 'Cây đã kín lá. Hãy gỡ lá gần nhất để gắn lá mới.'; return; }
      leaves.push({ to, text, color: form.elements.color.value });
      note.textContent = store.set('hv-leaves', leaves)
        ? 'Đã gắn lá lên cây. Bấm vào lá để đọc lại.'
        : 'Đã gắn lá, nhưng trình duyệt không cho lưu. Lá sẽ mất khi tải lại trang.';
      paint(leaves.length - 1);
      form.elements.to.value = form.elements.text.value = '';
    });
    $('[data-leaf-undo]', form).addEventListener('click', () => {
      if (!leaves.length) { note.textContent = 'Cây chưa có lá nào để gỡ.'; return; }
      leaves.pop();
      store.set('hv-leaves', leaves);
      reader.hidden = true;
      note.textContent = 'Đã gỡ lá gần nhất.';
      paint();
    });
    paint();
  }

  /* Mỗi lúc chỉ phát một video lời chúc */
  const videos = $$('.video-card video');
  videos.forEach((video) => video.addEventListener('play', () => {
    videos.forEach((other) => { if (other !== video) other.pause(); });
  }));

  /* Lightbox */
  const box = el('dialog', { className: 'lightbox' });
  box.setAttribute('aria-label', 'Xem ảnh');
  box.innerHTML = `<button class="btn lightbox__close" type="button">Đóng</button><img alt="">
    <div class="lightbox__bar"><button class="btn" type="button" data-prev>Trước</button><span data-at></span><button class="btn" type="button" data-after>Sau</button></div>`;
  document.body.append(box);
  let shots = [], shot = 0;
  const show = (i) => {
    shot = (i + shots.length) % shots.length;
    const image = $('img', box);
    image.src = shots[shot][0];
    image.alt = shots[shot][1];
    $('[data-at]', box).textContent = `${shot + 1}/${shots.length}`;
  };
  const open = (list, i) => { shots = list; show(i); box.showModal(); };
  $('.lightbox__close', box).addEventListener('click', () => box.close());
  $('[data-prev]', box).addEventListener('click', () => show(shot - 1));
  $('[data-after]', box).addEventListener('click', () => show(shot + 1));
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(shot - 1);
    if (e.key === 'ArrowRight') show(shot + 1);
  });
  let touchX = null;
  box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (touchX !== null && Math.abs(dx) > 50 && (window.visualViewport?.scale || 1) === 1) show(shot + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  const prints = $$('[data-zoom]');
  const album = new Map();
  prints.forEach((p) => { if (!album.has(p.dataset.zoom)) album.set(p.dataset.zoom, $('img', p).alt); });
  const albumKeys = [...album.keys()];
  prints.forEach((btn) => btn.addEventListener('click', () => open([...album], albumKeys.indexOf(btn.dataset.zoom))));

  /* Thư viện ảnh */
  const gallery = $('[data-gallery]');
  if (gallery) {
    const names = {
      'don-khach': 'Đón khách', 'khai-mac': 'Văn nghệ và khai mạc', 'tri-an': 'Lễ tri ân', 'tro-choi': 'Trò chơi',
      'ket-hoa': 'Kết hoa', 'cay': 'Trồng cây và tặng hoa', 'luu-niem': 'Lưu niệm',
    };
    // Phân nhóm theo số thứ tự máy ảnh, trùng với trình tự buổi lễ.
    const chapterOf = (id) => {
      if (id === '1995' || id === 'team') return 'luu-niem';
      if (id === 'domdom') return 'cay';
      const n = Number(id);
      const limits = [[8942, 'don-khach'], [8981, 'khai-mac'], [9112, 'tro-choi'], [9133, 'ket-hoa'], [9167, 'tri-an'], [9188, 'ket-hoa'], [9221, 'cay'], [Infinity, 'luu-niem']];
      return limits.find(([max]) => n <= max)[1];
    };
    const order = (id) => ({ domdom: 9191.5, team: 9235, 1995: 9300 })[id] || Number(id);
    const all = window.HV_PHOTOS.map(([id, ratio]) => ({ id, ratio, chapter: chapterOf(id) })).sort((a, b) => Object.keys(names).indexOf(a.chapter) - Object.keys(names).indexOf(b.chapter) || order(a.id) - order(b.id));
    const filters = $('[data-filters]');
    let list = all;
    const render = () => {
      const tiles = document.createDocumentFragment();
      list.forEach((photo, k) => {
        const btn = el('button', { type: 'button', className: 'sheen' });
        btn.style.setProperty('--r', photo.ratio);
        btn.append(el('img', { loading: 'lazy', decoding: 'async', src: small(photo.id), alt: `${names[photo.chapter]}, ảnh ${k + 1}` }));
        btn.addEventListener('click', () => open(list.map((p, j) => [large(p.id), `${names[p.chapter]}, ảnh ${j + 1}`]), k));
        tiles.append(btn);
      });
      gallery.replaceChildren(tiles);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    const filter = (key) => {
      list = key ? all.filter((p) => p.chapter === key) : all;
      $$('button', filters).forEach((b) => b.setAttribute('aria-pressed', b.dataset.key === key));
      render();
    };
    [['', 'Tất cả'], ...Object.entries(names)].forEach(([key, name]) => {
      const total = key ? all.filter((p) => p.chapter === key).length : all.length;
      const b = el('button', { type: 'button', textContent: `${name} (${total})` });
      b.dataset.key = key;
      b.addEventListener('click', () => filter(key));
      filters.append(b);
    });
    const fromHash = () => {
      const key = location.hash.slice(1);
      const known = Object.prototype.hasOwnProperty.call(names, key);
      filter(known ? key : '');
      if (known) document.getElementById('thu-vien').scrollIntoView();
    };
    addEventListener('hashchange', fromHash);
    fromHash();
  }
})();
