(async function () {
  const params = new URLSearchParams(location.search);
  const preview = params.get("preview");
  let W = window.WEDDING;
  // Dữ liệu cũ có một thẻ (eventFront, eventBack, eventMap) thì chuyển thành danh sách thẻ
  const fillSides = (o) => (o && o.groom && o.bride ? { ...o, groom: { ...window.WEDDING.groom, ...o.groom }, bride: { ...window.WEDDING.bride, ...o.bride } } : o);
  const migrate0 = (o) => (o && o.eventCards === undefined && o.eventFront !== undefined ? { ...o, eventCards: [{ front: o.eventFront, back: o.eventBack || "", map: o.eventMap || "" }] } : o);
  const migrate = (o) => fillSides(migrate0(o));
  if (preview) {
    try { const d = localStorage.getItem("wedding_draft"); if (d) W = { ...window.WEDDING, ...migrate(JSON.parse(d)) }; } catch {}
  } else {
    // Lấy nội dung đã đăng từ editor (nếu có), không có thì dùng config.js
    try {
      // ?fresh=1 bỏ qua bộ nhớ đệm để chủ thiệp xem ngay bản vừa đăng
      const r = await fetch(params.get("fresh") ? "/api/config?t=" + Date.now() : "/api/config", { cache: "no-store" });
      if (r.ok) { const d = await r.json(); if (d && d.groom && d.bride) W = { ...window.WEDDING, ...migrate(d) }; }
    } catch {}
  }
  const $ = (s) => document.querySelector(s);
  // Trình duyệt điện thoại co giãn thanh công cụ khi lướt làm chiều cao màn hình đổi liên tục; chỉ xử lý lại khi ĐỘ RỘNG đổi (xoay màn hình, đổi cỡ cửa sổ)
  const onWidthChange = (fn, delay = 0) => { let w = innerWidth, t = null; addEventListener("resize", () => { if (innerWidth === w) return; w = innerWidth; clearTimeout(t); t = setTimeout(fn, delay); }); };
  const heroOff = { v: false };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const bride = window.SIDE === "bride";
  const pair = bride ? [W.bride, W.groom] : [W.groom, W.bride];
  const names = `${esc(pair[0].name)} &amp; ${esc(pair[1].name)}`;
  // Vị trí ảnh (do editor lưu): "x% y%", không hợp lệ thì căn giữa
  const okPos = (v) => /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(v || "");
  const posOf = (u) => { const v = W.imgPos && W.imgPos[u]; return okPos(v) ? v : "50% 50%"; };
  // Vị trí riêng cho máy tính (nếu có), không thì dùng vị trí của điện thoại
  const posOfD = (u) => { const v = W.imgPosD && W.imgPosD[u]; return okPos(v) ? v : posOf(u); };

  document.title = `Thiệp Cưới ${pair[0].name} & ${pair[1].name}`;
  // trang 3 giữ nguyên bố cục như nhà trai ở cả hai thiệp (nhà trai bên trái)
  document.querySelectorAll("[data-names]").forEach((el) => (el.innerHTML = names));

  const date = new Date(W.date);
  $("#heroDate").textContent = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).replace(/\//g, " . ");
  $("#quote").textContent = W.quote;
  // co cỡ chữ lời mời để mỗi dòng nằm gọn trong một hàng (đúng số dòng đã xuống dòng)
  {
    const q = $("#quote");
    if (!/\n/.test(W.quote || "")) q.style.whiteSpace = "pre-line";
    const fitQuote = () => { q.style.fontSize = ""; if (q.style.whiteSpace === "pre-line") return; let f = parseFloat(getComputedStyle(q).fontSize); const box = q.parentElement; while (q.scrollWidth > box.clientWidth && f > 9) { f -= .5; q.style.fontSize = f + "px"; } };
    fitQuote();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitQuote);
    onWidthChange(fitQuote);
  }
  // màu chủ đề cho các trang nền màu (chọn trong editor); xem trước trong editor cập nhật tức thì qua tin nhắn
  applyTheme(W.theme);
  if (preview) addEventListener("message", (e) => {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === "theme") applyTheme(e.data.theme);
    if (e.data.type === "coverfit" && window.__applyCoverFit && !window.WEDDING.coverLocked) { W.coverFit = e.data.fit; window.__applyCoverFit(); }
  });
  const cssUrl = (u) => `url('${String(u).replace(/'/g, "%27")}')`;
  // Phần bên trong khung bìa: GIF hoặc MP4 động (có thể là ảnh tĩnh). Có hai nguồn riêng cho điện thoại (cover) và máy tính (coverD), thiếu một thì dùng cái kia.
  // Ảnh bìa cố định trong mã: bỏ qua file bìa, vị trí và kích thước đã đăng từ editor
  if (window.WEDDING.coverLocked) {
    const L = window.WEDDING;
    W = { ...W, cover: L.cover, coverD: L.coverD, coverFit: L.coverFit, coverFitMode: L.coverFitMode };
  }
  const coverM = W.cover || W.coverD, coverD = W.coverD || W.cover;
  {
    const h = $(".hero"), media = $("#coverMedia");
    const isVideo = (u) => /\.(mp4|webm|mov)(\?|#|$)/i.test(u);
    let shown = null;
    const renderCover = () => {
      const wide = innerWidth >= 760, u = (wide ? coverD : coverM) || "";
      if (u === shown) return;
      shown = u;
      if (!u) { media.innerHTML = ""; return; }
      media.innerHTML = isVideo(u)
        ? `<video src="${esc(u)}" autoplay muted loop playsinline preload="auto" disablepictureinpicture></video>`
        : `<img src="${esc(u)}" alt="">`;
      const v = media.querySelector("video"); if (v) { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    };
    // Vị trí và kích thước file bìa trong khung: riêng cho điện thoại (m) và máy tính (d)
    const applyFit = () => {
      const f = (W.coverFit && (innerWidth >= 760 ? W.coverFit.d : W.coverFit.m)) || {};
      const num = (v, d, a, b) => { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
      const contain = (W.coverFitMode || "cover") === "contain";
      media.style.setProperty("--co", contain ? "contain" : "cover");
      media.style.setProperty("--cop", contain ? "50% 100%" : "50% 50%");
      media.style.setProperty("--cs", (num(f.s, 100, 30, 400) / 100).toFixed(3));
      media.style.setProperty("--cx", String(num(f.x, 0, -100, 100)));
      media.style.setProperty("--cy", String(num(f.y, 0, -100, 100)));
    };
    window.__applyCoverFit = applyFit;
    applyFit();
    renderCover();
    onWidthChange(() => { renderCover(); applyFit(); });
    // Khối chữ và đồng hồ chỉ được chiếm khoảng 30% chiều cao ảnh đang hiển thị; ảnh co nhỏ (màn hình thấp, xoay ngang) thì chữ thu nhỏ theo để không che hai người
    const inner = h.querySelector(".hero-inner");
    const fitText = () => {
      if (!h.classList.contains("fit") || !inner) return;
      const wide = innerWidth >= 760;
      const ar = parseFloat(getComputedStyle(h).getPropertyValue(wide ? "--ar-d" : "--ar")) || parseFloat(getComputedStyle(h).getPropertyValue("--ar")) || 0.5;
      const ih = Math.min(h.getBoundingClientRect().height, Math.min(innerWidth, 900) / ar);
      const th = inner.offsetHeight || 1;
      h.style.setProperty("--k", String(Math.max(0.5, Math.min(1, (0.3 * ih) / th)).toFixed(3)));
    };
    const refit = () => requestAnimationFrame(fitText);
    onWidthChange(refit);
    addEventListener("orientationchange", () => setTimeout(refit, 250));
    window.addEventListener("load", refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  }
  $("#groomName").textContent = W.groom.fullName;
  $("#brideName").textContent = W.bride.fullName;
  // "Ông A & Bà B" được tách thành hai dòng riêng
  // Chữ "Ông", "Bà" được làm nhạt hơn phần tên
  const parentsHtml = (t) => String(t || "").split(/\s*&\s*/).filter(Boolean).map((l) => {
    const m = /^(Ông|Bà|ông|bà)\s+(.+)$/.exec(l.trim());
    return m ? `<span><em class="hon">${esc(m[1])}</em> ${esc(m[2])}</span>` : `<span>${esc(l)}</span>`;
  }).join("");
  $("#groomParents").innerHTML = parentsHtml(W.groom.parents);
  $("#groomAddr").textContent = String(W.groom.address || "").trim(); $("#groomAddr").hidden = !String(W.groom.address || "").trim();
  $("#brideAddr").textContent = String(W.bride.address || "").trim(); $("#brideAddr").hidden = !String(W.bride.address || "").trim();
  $("#brideParents").innerHTML = parentsHtml(W.bride.parents);
  $(".hero").dataset.align = W.heroAlign || "bottom";
  // Độ đậm ảnh bìa 0 đến 100 (mặc định 100 = không phủ lớp kem mờ)
  const strength = Math.min(100, Math.max(0, Number(W.coverStrength ?? 100) || 0));
  $(".hero").style.setProperty("--veil", String(1 - strength / 100));

  // Các thẻ sự kiện lật: mặt trước động đậy nhẹ, chạm vào thì lật sang mặt sau (ngày giờ, địa chỉ)
  (() => {
    const list = $("#evlist");
    const cards = (W.eventCards || []).filter((c) => c && (c.front || c.back));
    $(".ev-hint").hidden = !cards.length;
    const cardHtml = (c, i) => `
      <div class="evflip" style="--d:${(i * 0.9).toFixed(1)}s">
        <div class="ev-float">
          <div class="ev-card" role="button" tabindex="0" aria-label="Thiệp sự kiện, chạm để lật xem ngày giờ và địa chỉ">
            <div class="ev-face ev-front"><img src="${esc(c.front || c.back)}" alt="Thiệp sự kiện mặt trước" width="1400" height="930" decoding="async" loading="lazy"></div>
            <div class="ev-face ev-back"><img src="${esc(c.back || c.front)}" alt="Ngày giờ và địa chỉ" width="1400" height="930" decoding="async" loading="lazy">${c.map ? `<a class="ev-map" href="${esc(c.map)}" target="_blank" rel="noopener" aria-label="Xem bản đồ Google Maps"></a>` : ""}</div>
          </div>
        </div>
      </div>`;
    list.innerHTML = cards.map((c, i) => cardHtml(c, i)).join("");
    list.querySelectorAll(".ev-card").forEach((card) => {
      let touched = false, timer = null, done = false;
      const flip = () => { const f = card.classList.toggle("flipped"); card.closest(".evflip").classList.toggle("is-flipped", f); };
      // chạm vào thẻ thì lật qua lại tùy ý (và không tự lật nữa)
      const manual = () => { touched = true; if (timer) { clearTimeout(timer); timer = null; } flip(); };
      card.addEventListener("click", (e) => { if (e.target.closest(".ev-map")) return; manual(); });
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); manual(); } });
      // tự lật một lần, 1 giây sau khi thẻ vừa hiện ra trên màn hình, kể cả khi người xem lướt qua luôn mà không dừng lại
      const wrap = card.closest(".evflip");
      const io = new IntersectionObserver((en) => {
        if (done || touched || !en.some((x) => x.isIntersecting)) return;
        io.disconnect();
        timer = setTimeout(() => { timer = null; if (!done && !touched) { done = true; flip(); } }, 1000);
      }, { threshold: 0.15 });
      io.observe(wrap);
    });
  })();

  const lb = $("#lightbox");
  // Phóng to ảnh: ảnh nở dần từ vị trí ảnh nhỏ tới kích thước đầy đủ, đóng lại thì thu về chỗ cũ
  let lbFrom = null, lbBusy = false;
  const lbMove = (from) => {
    const li = lb.querySelector("img"), to = li.getBoundingClientRect();
    if (!from || !to.width) return null;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2), dy = from.top + from.height / 2 - (to.top + to.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${Math.max(.05, from.width / to.width)})`;
  };
  function openLb(url, from) {
    const li = lb.querySelector("img");
    lbFrom = from;
    const run = () => {
      lb.hidden = false;
      const t = lbMove(from);
      if (!li.animate) return;
      lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
      li.animate([{ transform: t || "scale(.6)", opacity: t ? 1 : 0 }, { transform: "none", opacity: 1 }], { duration: 520, easing: "cubic-bezier(.22,.8,.25,1)" });
    };
    li.onload = null;
    li.src = url;
    // ảnh đã nạp sẵn trong sách nên hiện ngay; chưa nạp thì chờ nạp xong để biết kích thước
    if (li.complete && li.naturalWidth) run(); else { li.onload = run; li.onerror = run; }
  }
  function closeLb() {
    if (lb.hidden || lbBusy) return;
    const li = lb.querySelector("img");
    if (!li.animate) { lb.hidden = true; return; }
    lbBusy = true;
    const t = lbMove(lbFrom);
    lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, easing: "ease-in", fill: "forwards" });
    li.animate([{ transform: "none", opacity: 1 }, { transform: t || "scale(.6)", opacity: t ? 1 : 0 }], { duration: 400, easing: "cubic-bezier(.5,0,.75,.2)", fill: "forwards" })
      .finished.then(() => { lb.hidden = true; lbBusy = false; lb.getAnimations().forEach((a) => a.cancel()); li.getAnimations().forEach((a) => a.cancel()); }, () => { lb.hidden = true; lbBusy = false; });
  }

  // ---- Album ảnh kiểu doodle: mỗi lần một ảnh trong khung vẽ tay, ảnh mới được "tô" ra bằng nét cọ quét, kèm hình doodle bay ra.
  // Chạy giống nhau trên điện thoại và máy tính.
  (() => {
    const wrap = $("#reel"), cv = $("#reelCanvas"), fx = $("#reelFx"), prevBtn = $("#flipPrev"), nextBtn = $("#flipNext"), countEl = $("#flipCount"), zoomBtn = $("#reelZoom");
    if (!wrap || !cv) return;
    const photos = (W.gallery || []).filter(Boolean);
    const ctx = cv.getContext("2d");
    const mask = document.createElement("canvas"), mctx = mask.getContext("2d");
    const imgs = photos.map(() => null);
    let idx = -1, anim = 0, started = false, cw = 0, ch = 0;
    $("#p5").hidden = !photos.length;
    if (!photos.length) return;

    const load = (i) => new Promise((res) => {
      if (imgs[i]) return res(imgs[i]);
      const im = new Image();
      im.onload = () => { imgs[i] = im; res(im); };
      im.onerror = () => res(null);
      im.src = photos[i];
    });
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      cw = Math.max(2, Math.round(r.width * d)); ch = Math.max(2, Math.round(r.height * d));
      if (cv.width !== cw || cv.height !== ch) { cv.width = mask.width = cw; cv.height = mask.height = ch; }
    };
    // vẽ ảnh phủ kín khung (như object-fit: cover) theo vị trí đã chỉnh trong editor
    const paint = (c, im, i) => {
      if (!im) { c.fillStyle = "#f1e3c1"; c.fillRect(0, 0, cw, ch); return; }
      const [px, py] = posOf(photos[i]).split(" ").map((v) => parseFloat(v) / 100);
      const sc = Math.max(cw / im.naturalWidth, ch / im.naturalHeight), w = im.naturalWidth * sc, h = im.naturalHeight * sc;
      c.drawImage(im, (cw - w) * px, (ch - h) * py, w, h);
    };
    // đường cọ zíc zắc từ trên xuống, hơi run tay
    const strokePath = () => {
      const rows = 7, pts = [], per = 26;
      for (let r = 0; r < rows; r++) for (let k = 0; k <= per; k++) {
        const t = k / per, x = (r % 2 ? 1 - t : t) * 1.16 - 0.08, y = (r + 0.5) / rows + Math.sin(t * 9 + r * 2.1) * 0.012 + (Math.random() - 0.5) * 0.008;
        pts.push([x * cw, y * ch]);
      }
      return { pts, width: (ch / rows) * 1.55 };
    };
    const doodles = [
      (c) => `<svg viewBox="0 0 24 24"><path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="${c}" stroke="#6b3f1d" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
      (c) => `<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="${c}" stroke="#6b3f1d" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
      () => `<svg viewBox="0 0 24 24"><g fill="#e0a56c" stroke="#6b3f1d" stroke-width="1.4"><ellipse cx="12" cy="15.5" rx="5.2" ry="4.4"/><circle cx="5.5" cy="10" r="2.2"/><circle cx="9.5" cy="5.8" r="2.2"/><circle cx="14.5" cy="5.8" r="2.2"/><circle cx="18.5" cy="10" r="2.2"/></g></svg>`,
      (c) => `<svg viewBox="0 0 24 24"><path d="M3 14c3-6 6-6 9 0s6 6 9 0" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>`,
    ];
    // các hình doodle xuất hiện quanh mép khung ảnh rồi bay ra phía ngoài
    const burst = () => {
      const cols = ["#f6c453", "#f28b82", "#ffd9c9", "#bfe0c0", "#fff1b8"], n = 12;
      for (let k = 0; k < n; k++) {
        const el = document.createElement("i");
        el.className = "dd";
        const a = (k / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const cx = Math.cos(a), cy = Math.sin(a), m = Math.max(Math.abs(cx) / 0.5, Math.abs(cy) / 0.5);
        const ex = 50 + (cx / m) * 100, ey = 50 + (cy / m) * 100; // điểm trên mép khung ảnh (%)
        const out = 18 + Math.random() * 22;
        el.style.cssText = `left:${ex.toFixed(1)}%;top:${ey.toFixed(1)}%;--x:${(cx * out).toFixed(0)}px;--y:${(cy * out).toFixed(0)}px;--r:${(Math.random() * 240 - 120).toFixed(0)}deg;--s:${(16 + Math.random() * 12).toFixed(0)}px;animation-delay:${(Math.random() * 0.35).toFixed(2)}s`;
        el.innerHTML = doodles[k % doodles.length](cols[k % cols.length]);
        fx.appendChild(el);
        el.addEventListener("animationend", () => el.remove());
      }
    };
    const label = () => { countEl.textContent = idx < 0 ? `${photos.length} ảnh` : `Ảnh ${idx + 1} / ${photos.length}`; };

    async function show(i, instant) {
      const n = photos.length;
      i = ((i % n) + n) % n;
      const id = ++anim;
      const im = await load(i);
      if (id !== anim) return;
      idx = i; label();
      load((i + 1) % n); // nạp sẵn ảnh kế tiếp
      size();
      if (instant) { paint(ctx, im, i); return; }
      const base = document.createElement("canvas");
      base.width = cw; base.height = ch;
      base.getContext("2d").drawImage(cv, 0, 0);
      const { pts, width } = strokePath(), T = 1500, t0 = performance.now();
      burst();
      const step = (now) => {
        if (id !== anim) return;
        const t = Math.min(1, (now - t0) / T), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, upto = Math.max(2, Math.round(e * pts.length));
        mctx.globalCompositeOperation = "source-over";
        mctx.clearRect(0, 0, cw, ch);
        mctx.lineWidth = width; mctx.lineCap = "round"; mctx.lineJoin = "round"; mctx.strokeStyle = "#000";
        mctx.beginPath(); mctx.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < upto; k++) mctx.lineTo(pts[k][0], pts[k][1]);
        mctx.stroke();
        mctx.globalCompositeOperation = "source-in";
        paint(mctx, im, i);
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(base, 0, 0);
        ctx.drawImage(mask, 0, 0);
        if (t < 1) requestAnimationFrame(step); else paint(ctx, im, i);
      };
      requestAnimationFrame(step);
    }
    const go = (d) => { started = true; show((idx < 0 ? (d > 0 ? -1 : 0) : idx) + d); };
    prevBtn.addEventListener("click", () => go(-1));
    nextBtn.addEventListener("click", () => go(1));
    let down = null;
    wrap.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
    wrap.addEventListener("pointerup", (e) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      down = null;
      if (e.target.closest("button")) return;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) return go(dx < 0 ? 1 : -1);
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) { const r = wrap.getBoundingClientRect(); go(e.clientX - r.left > r.width * 0.4 ? 1 : -1); }
    });
    wrap.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); });
    zoomBtn.addEventListener("click", () => { if (idx >= 0) openLb(photos[idx], cv.getBoundingClientRect()); });
    let rt = null;
    onWidthChange(() => { if (idx >= 0) show(idx, true); }, 150);
    label();
    load(0);
    // khi khung ảnh vừa hiện ra trên màn hình thì tự "tô" ảnh đầu tiên sau nửa giây, kể cả khi người xem lướt qua luôn mà không dừng lại
    const io2 = new IntersectionObserver((en) => {
      if (started) return io2.disconnect();
      if (!en.some((x) => x.isIntersecting)) return;
      io2.disconnect();
      setTimeout(() => { if (!started) { started = true; show(0); } }, 500);
    }, { threshold: 0.15 });
    io2.observe(wrap);
  })();
  lb.addEventListener("click", closeLb);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  // Lời chúc của khách mời: lời chúc nhập trong editor + lời chúc được tick "Hiển thị" trong Google Sheet.
  // Hiện ngẫu nhiên trên giấy note doodle, tự đổi sau mỗi 5 giây.
  (() => {
    const wrap = $("#wishesWrap"), box = $("#wishes");
    const clean = (l) => (l || []).filter((w) => w && String(w.text || "").trim()).map((w) => ({ name: String(w.name || "").trim(), text: String(w.text).trim() }));
    let pool = clean(W.wishes), order = [], pos = 0, timer = null;
    const colors = ["#fff1b8", "#ffd9c9", "#e4efc9", "#fde1ec", "#e3ecf7"], rots = [-2.2, 1.6, -1.2, 2.1, -1.8, 1.0], marks = ["♡", "✦", "☆", "✿"];
    // Số tờ note tính theo chỗ thật còn trống trong khung lời chúc (chiều cao trang 6 cố định theo màn hình nhỏ nhất, không đổi khi thanh công cụ trình duyệt co giãn):
    // máy tính tối đa 3 cột x 2 hàng, điện thoại 2 cột x tối đa 3 hàng
    const area = wrap;
    const per = () => {
      const cols = innerWidth >= 760 ? 3 : 2, maxRows = innerWidth >= 760 ? 2 : 3;
      const probe = document.createElement("div");
      probe.style.cssText = "height:var(--note-h);visibility:hidden;position:absolute;left:0;right:0";
      box.appendChild(probe);
      const nh = probe.offsetHeight || 96; probe.remove();
      const gap = parseFloat(getComputedStyle(box).rowGap) || 16;
      const avail = area.clientHeight - 14;
      return cols * Math.max(1, Math.min(maxRows, Math.floor((avail + gap) / (nh + gap))));
    };
    const shuffle = () => { order = pool.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } pos = 0; };
    const render = () => {
      if (!pool.length) return;
      const k = Math.min(per(), pool.length), html = [];
      const used = new Set();
      for (let t = 0; t < k; t++) {
        if (pos >= order.length) shuffle();
        // không lặp lại cùng một lời chúc trong một lượt hiển thị
        let tries = 0;
        while (used.has(order[pos]) && tries++ < order.length) { if (++pos >= order.length) shuffle(); }
        used.add(order[pos]);
        const w = pool[order[pos++]], i = Math.floor(Math.random() * 20);
        html.push(`<figure class="note in" style="--nc:${colors[i % colors.length]};--nr:${rots[i % rots.length]}deg"><span class="note-mark" aria-hidden="true">${marks[i % marks.length]}</span><p>${esc(w.text)}</p>${w.name ? `<cite>${esc(w.name)}</cite>` : ""}</figure>`);
      }
      box.innerHTML = html.join("");
    };
    // khi khung lời chúc đổi kích thước (xoay màn hình, thanh công cụ co giãn): chỉ vẽ lại khi số tờ thật sự đổi
    let lastPer = 0, rt = null;
    new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { const k = per(); if (k !== lastPer) { lastPer = k; if (pool.length) { render(); start2(); } } }, 120); }).observe(area);
    const start2 = () => {
      clearInterval(timer);
      if (pool.length > per()) timer = setInterval(() => { if (document.getElementById("p6").classList.contains("off")) return; box.classList.add("out"); setTimeout(() => { box.classList.remove("out"); render(); }, 260); }, 5000);
    };
    const start = () => {
      wrap.hidden = !pool.length;
      if (!pool.length) return;
      lastPer = per();
      shuffle(); render();
      start2();
    };
    start();
    if (W.rsvpEndpoint && /^https?:\/\//.test(W.rsvpEndpoint)) {
      fetch(W.rsvpEndpoint).then((r) => r.json()).then((d) => { const extra = clean(d && d.wishes); if (extra.length) { pool = pool.concat(extra); start(); } }).catch(() => {});
    }
  })();

  // Hộp mừng cưới: hộp quà doodle động đậy nhẹ, bấm vào thì nắp bật ra và hiện các tài khoản mừng cưới
  (() => {
    const gb = $("#giftBox"), area = $("#giftArea");
    const open = () => { if (gb.classList.contains("open")) return; gb.classList.add("open"); gb.setAttribute("aria-expanded", "true"); setTimeout(() => { area.hidden = false; area.classList.add("show"); }, 420); };
    gb.addEventListener("click", open);
    gb.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  })();

  $("#gifts").innerHTML = W.gifts.map((g) => `
    <div class="gift">
      <p class="small">Mừng cưới ${esc(g.side)}</p>
      ${g.qr ? `<img src="${esc(g.qr)}" alt="QR chuyển khoản">` : ""}
      <p>${esc(g.bank)}</p>
      <p class="acc">${esc(g.account)}</p>
      <p>${esc(g.owner)}</p>
      <button data-copy="${esc(g.account)}">Sao chép số tài khoản</button>
    </div>`).join("");
  $("#gifts").addEventListener("click", async (e) => {
    const v = e.target.dataset.copy;
    if (!v) return;
    try { await navigator.clipboard.writeText(v); e.target.textContent = "Đã sao chép"; }
    catch { e.target.textContent = v; }
  });

  // Countdown
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    let diff = Math.max(0, date - Date.now()) / 1000;
    $("#cd-d").textContent = Math.floor(diff / 86400);
    $("#cd-h").textContent = pad(Math.floor((diff % 86400) / 3600));
    $("#cd-m").textContent = pad(Math.floor((diff % 3600) / 60));
    $("#cd-s").textContent = pad(Math.floor(diff % 60));
  }
  tick(); setInterval(() => { if (!heroOff.v) tick(); }, 1000);

  // Music
  const audio = $("#bgm"), mBtn = $("#musicBtn");
  if (W.music) {
    audio.preload = "none"; audio.src = W.music; mBtn.hidden = false; // chỉ tải nhạc khi khách mở thiệp
    mBtn.addEventListener("click", () => (audio.paused ? audio.play() : audio.pause()));
    audio.addEventListener("play", () => mBtn.classList.add("playing"));
    audio.addEventListener("pause", () => mBtn.classList.remove("playing"));
  }

  // Luôn bắt đầu từ đầu trang, không để trình duyệt tự cuộn về vị trí lần xem trước
  window.scrollTo(0, 0);
  window.addEventListener("pageshow", (e) => { if (e.persisted) window.scrollTo(0, 0); });

  // Envelope
  const env = $("#envelope");
  const leavesMode = (m) => { const lv = $("#leaves"); if (lv) lv.dataset.mode = m; };
  if (preview && !params.get("intro")) {
    env.remove(); leavesMode("doodle");
  } else {
    const bgM = W.introBg || W.introBgD, bgD = W.introBgD || W.introBg;
    if (bgM) {
      const wash = "linear-gradient(rgba(255,255,255,.12), rgba(60,40,30,.18)), ";
      env.style.setProperty("--img", wash + cssUrl(bgM));
      env.style.setProperty("--img-d", wash + cssUrl(bgD));
      env.style.setProperty("--pos", posOf(bgM));
      env.style.setProperty("--pos-d", posOfD(bgD));
    }
    const guest = (params.get("to") || "").trim().slice(0, 60);
    document.body.classList.add("locked");
    $("#envNames").innerHTML = names;
    $("#envDate").textContent = (W.introDate || "").trim() || $("#heroDate").textContent;
    $("#envGuest").textContent = guest || "Quý khách";
    let opened = false;
    const openIt = () => {
      if (opened) return;
      opened = true;
      env.classList.add("open");
      if (W.music) audio.play().catch(() => {});
      const t0 = performance.now(), ms = 1500;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const p = (e * 1.08).toFixed(4); // vượt nhẹ để cuộn giấy ra khỏi màn hình
        env.style.setProperty("--p", p);
        if (k < 1) return requestAnimationFrame(step);
        leavesMode("doodle");
        document.body.classList.remove("locked");
        env.remove();
      };
      requestAnimationFrame(step);
    };
    env.addEventListener("click", openIt);
  }

  // Lá vàng rơi nhè nhẹ
  (() => {
    const box = $("#leaves");
    if (!box) return;
    // lá kiểu doodle: viền nâu nét tay, gân lá, màu vàng cam ấm; ba hình dáng lá khác nhau
    const colors = ["#f6c453", "#f1a65a", "#f7d98b", "#e8955a"];
    const shapes = [
      (c) => `<path d='M16 3C7 9 5 22 16 37C27 22 25 9 16 3Z' fill='${c}' stroke='#5a3216' stroke-width='2.2' stroke-linejoin='round'/><path d='M16 6V36M16 16l-5-4M16 22l6-5M16 28l-5-4' fill='none' stroke='#5a3216' stroke-width='1.6' stroke-linecap='round'/>`,
      (c) => `<path d='M16 4C10 4 4 10 5 18C6 27 12 33 16 37C20 33 26 27 27 18C28 10 22 4 16 4Z' fill='${c}' stroke='#5a3216' stroke-width='2.2' stroke-linejoin='round'/><path d='M16 8V36M16 18c-3-2-6-2-8-1M16 18c3-2 6-2 8-1M16 27c-3-2-5-2-7-1M16 27c3-2 5-2 7-1' fill='none' stroke='#5a3216' stroke-width='1.5' stroke-linecap='round'/>`,
      (c) => `<path d='M16 36L14 30C8 30 4 26 5 21C2 18 3 13 7 12C6 7 11 4 14 7C15 3 17 3 18 7C21 4 26 7 25 12C29 13 30 18 27 21C28 26 24 30 18 30Z' fill='${c}' stroke='#5a3216' stroke-width='2.1' stroke-linejoin='round'/><path d='M16 34V12M16 22l-5-5M16 22l5-5' fill='none' stroke='#5a3216' stroke-width='1.5' stroke-linecap='round'/>`,
    ];
    const svg = (c, k) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 40'>${shapes[k](c)}</svg>`)}")`;
    // lá vàng kiểu cũ (nét đơn giản, không viền) cho trang mở thiệp, nhỏ và mờ
    const classicColors = ["#e0a63a", "#d18f26", "#e9bd5c", "#c97b1d"];
    const classicSvg = (c) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 32'><path d='M12 1C5 8 3 18 12 31C21 18 19 8 12 1Z' fill='${c}'/><path d='M12 4V29' stroke='rgba(120,70,10,.45)' stroke-width='1' fill='none'/></svg>`)}")`;
    box.dataset.mode = document.getElementById("envelope") ? "classic" : "doodle";
    const n = innerWidth < 600 ? 6 : 12;
    const mk = (kind, i) => {
      const el = document.createElement("span");
      el.className = "leaf " + kind;
      const classic = kind === "classic";
      const size = classic ? 9 + Math.random() * 9 : 12 + Math.random() * 10;
      el.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;width:${size.toFixed(1)}px;height:${(size * 1.3).toFixed(1)}px;--d:${(14 + Math.random() * 10).toFixed(1)}s;--delay:${(-Math.random() * 22).toFixed(1)}s;--drift:${(Math.random() * 160 - 80).toFixed(0)}px;--rot:${(180 + Math.random() * 360).toFixed(0)}deg;--sway:${(3 + Math.random() * 3).toFixed(1)}s;opacity:${classic ? (0.3 + Math.random() * 0.3).toFixed(2) : (0.55 + Math.random() * 0.35).toFixed(2)}`;
      const leaf = document.createElement("i");
      leaf.style.backgroundImage = classic ? classicSvg(classicColors[i % classicColors.length]) : svg(colors[i % colors.length], i % shapes.length);
      el.appendChild(leaf);
      box.appendChild(el);
    };
    for (let i = 0; i < n; i++) { mk("classic", i); mk("doodle", i); }
  })();

  // Tạm dừng hoạt ảnh của phần nằm ngoài màn hình (lớp .off): giảm tải CPU/GPU khi lướt, nhất là trên điện thoại
  (() => {
    const secs = [...document.querySelectorAll("header.hero, main .page")];
    if (!("IntersectionObserver" in window)) return;
    const io3 = new IntersectionObserver((entries) => entries.forEach((en) => {
      en.target.classList.toggle("off", !en.isIntersecting);
      if (en.target.matches("header.hero")) heroOff.v = !en.isIntersecting;
    }), { rootMargin: "120px 0px" });
    secs.forEach((el) => io3.observe(el));
  })();

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("show"); io.unobserve(en.target); }
  }), { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // Đếm ký tự lời chúc (tối đa 50 để hiện trọn trên giấy note ở mọi màn hình)
  (() => {
    const ta = document.querySelector("#rsvp [name=message]"), cnt = $("#msgCount");
    if (!ta || !cnt) return;
    const upd = () => { cnt.textContent = `${ta.value.length} / 50 ký tự`; cnt.classList.toggle("full", ta.value.length >= 50); };
    ta.addEventListener("input", upd); $("#rsvp").addEventListener("reset", () => setTimeout(upd));
  })();

  // RSVP
  $("#rsvp").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.side = window.SIDE === "bride" ? "Nhà gái" : "Nhà trai";
    const msg = $("#rsvpMsg");
    msg.textContent = "Đang gửi...";
    try {
      if (W.rsvpEndpoint) {
        await fetch(W.rsvpEndpoint, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) });
      } else {
        try { localStorage.setItem("rsvp", JSON.stringify(data)); } catch {}
      }
      msg.textContent = `Cảm ơn ${data.name}! Chúng mình đã nhận được lời chúc của bạn.`;
      e.target.reset();
    } catch {
      msg.textContent = "Có lỗi xảy ra, bạn vui lòng thử lại nhé.";
    }
  });

  // Chỉ hiện trang khi mọi thứ đã sẵn sàng (font, ảnh nền mở thiệp, ảnh bìa và khung), tránh cảnh từng phần hiện lên lần lượt
  (async () => {
    const wide = innerWidth >= 760;
    const urls = [];
    const intro = wide ? (W.introBgD || W.introBg) : (W.introBg || W.introBgD);
    if (intro && !(preview && !params.get("intro"))) urls.push(intro);
    const cov = wide ? (W.coverD || W.cover) : (W.cover || W.coverD);
    if (cov && !/\.(mp4|webm|mov)(\?|#|$)/i.test(cov)) urls.push(cov);
    urls.push(wide ? "images/frame-desktop.webp" : "images/frame-phone.webp");
    const img = (u) => new Promise((res) => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = u; if (i.decode) i.decode().then(res, res); });
    const fonts = document.fonts ? Promise.all(["400 1rem 'Fuzzy Bubbles'", "700 1rem 'Fuzzy Bubbles'", "700 1rem 'Dancing Script'", "700 1rem 'Noto Serif SC'"].map((f) => document.fonts.load(f, "Hiếu Duyên 囍").catch(() => {}))).then(() => document.fonts.ready) : Promise.resolve();
    await Promise.race([Promise.all([fonts, ...urls.map(img)]), new Promise((r) => setTimeout(r, 4500))]);
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("loading")));
  })();
})();


// Cuộn xong thì nhảy tới trang đang hiện nhiều nhất (trừ khi đang đọc giữa một trang cao hơn màn hình)
(() => {
  if (new URLSearchParams(location.search).has("preview")) return;
  const pages = () => [...document.querySelectorAll("header.hero, main .page")];
  let t, busy = false;
  // trượt chậm và mượt (easeInOut) thay cho cuộn mặc định của trình duyệt
  const glide = (dy, ms) => {
    const y0 = scrollY, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      scrollTo({ top: y0 + dy * e, behavior: "instant" });
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const snap = () => {
    if (busy || document.body.classList.contains("locked")) return;
    const vh = innerHeight; let best = null, bestV = 0;
    pages().forEach((el) => {
      const r = el.getBoundingClientRect();
      const v = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (v > bestV) { bestV = v; best = el; }
    });
    if (!best) return;
    const r = best.getBoundingClientRect();
    if (r.height > vh * 1.05 && r.top < 0 && r.bottom > vh * 0.6) return;
    if (Math.abs(r.top) < 2) return;
    busy = true;
    glide(r.top, 900);
    setTimeout(() => { busy = false; }, 1000);
  };
  addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(snap, 2000); }, { passive: true });
})();

// Nút chỉ xuống ở ảnh bìa: biến mất ngay khi khách bắt đầu lướt
(() => {
  const el = document.getElementById("scrollHint");
  if (!el) return;
  const hide = () => { el.classList.add("gone"); ["wheel", "touchmove", "keydown", "scroll"].forEach((n) => removeEventListener(n, onAct)); };
  const onAct = (e) => {
    if (e.type === "keydown" && !["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(e.key)) return;
    if (e.type === "scroll" && window.scrollY < 2) return;
    hide();
  };
  ["wheel", "touchmove", "keydown", "scroll"].forEach((n) => addEventListener(n, onAct, { passive: true }));
})();
