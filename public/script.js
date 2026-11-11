(async function () {
  const params = new URLSearchParams(location.search);
  const preview = params.get("preview");
  let W = window.WEDDING;
  // Dữ liệu cũ có một thẻ (eventFront, eventBack, eventMap) thì chuyển thành danh sách thẻ
  const migrate = (o) => (o && o.eventCards === undefined && o.eventFront !== undefined ? { ...o, eventCards: [{ front: o.eventFront, back: o.eventBack || "", map: o.eventMap || "" }] } : o);
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
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const names = `${esc(W.groom.name)} &amp; ${esc(W.bride.name)}`;
  // Vị trí ảnh (do editor lưu): "x% y%", không hợp lệ thì căn giữa
  const okPos = (v) => /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(v || "");
  const posOf = (u) => { const v = W.imgPos && W.imgPos[u]; return okPos(v) ? v : "50% 50%"; };
  // Vị trí riêng cho máy tính (nếu có), không thì dùng vị trí của điện thoại
  const posOfD = (u) => { const v = W.imgPosD && W.imgPosD[u]; return okPos(v) ? v : posOf(u); };

  document.title = `Thiệp Cưới ${W.groom.name} & ${W.bride.name}`;
  document.querySelectorAll("[data-names]").forEach((el) => (el.innerHTML = names));

  const date = new Date(W.date);
  $("#heroDate").textContent = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).replace(/\//g, " . ");
  $("#quote").textContent = W.quote;
  const cssUrl = (u) => `url('${String(u).replace(/'/g, "%27")}')`;
  // Ảnh riêng cho điện thoại (cover) và máy tính (coverD); thiếu một trong hai thì dùng ảnh còn lại
  const coverM = W.cover || W.coverD, coverD = W.coverD || W.cover;
  if (coverM) {
    const h = $(".hero");
    h.style.setProperty("--img", cssUrl(coverM));
    h.style.setProperty("--img-d", cssUrl(coverD));
    h.style.setProperty("--pos", posOf(coverM));
    h.style.setProperty("--pos-d", posOfD(coverD));
    // Khung trang đầu có đúng tỉ lệ của ảnh nên ảnh luôn hiện trọn vẹn, không bị cắt dù trình duyệt tính chiều cao màn hình thế nào
    const ratio = (u, name) => { const im = new Image(); im.onload = () => { if (im.naturalWidth && im.naturalHeight) { h.style.setProperty(name, (im.naturalWidth / im.naturalHeight).toFixed(4)); h.classList.add("fit"); refit(); } }; im.src = u; };
    ratio(coverM, "--ar");
    ratio(coverD, "--ar-d");
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
    addEventListener("resize", refit);
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
    list.innerHTML = cards.map((c, i) => `
      <div class="evflip" style="--d:${(i * 0.9).toFixed(1)}s">
        <div class="ev-float">
          <div class="ev-card" role="button" tabindex="0" aria-label="Thiệp sự kiện, chạm để lật xem ngày giờ và địa chỉ">
            <div class="ev-face ev-front"><img src="${esc(c.front || c.back)}" alt="Thiệp sự kiện mặt trước" width="1400" height="930"></div>
            <div class="ev-face ev-back"><img src="${esc(c.back || c.front)}" alt="Ngày giờ và địa chỉ" width="1400" height="930">${c.map ? `<a class="ev-map" href="${esc(c.map)}" target="_blank" rel="noopener" aria-label="Xem bản đồ Google Maps"></a>` : ""}</div>
          </div>
        </div>
      </div>`).join("");
    list.querySelectorAll(".ev-card").forEach((card) => {
      let touched = false, timer = null, done = false;
      const flip = () => { const f = card.classList.toggle("flipped"); card.closest(".evflip").classList.toggle("is-flipped", f); };
      // chạm vào thẻ thì lật qua lại tùy ý (và không tự lật nữa)
      const manual = () => { touched = true; if (timer) { clearTimeout(timer); timer = null; } flip(); };
      card.addEventListener("click", (e) => { if (e.target.closest(".ev-map")) return; manual(); });
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); manual(); } });
      // tự lật một lần, 2 giây sau khi cuộn tới và thấy trọn thẻ; cuộn đi giữa chừng thì hủy
      const wrap = card.closest(".evflip");
      const fully = () => { const r = card.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight; };
      const io = new IntersectionObserver(() => {
        if (done || touched) return;
        if (fully()) {
          if (!timer) timer = setTimeout(() => { timer = null; if (!done && !touched && fully()) { done = true; io.disconnect(); flip(); } }, 2000);
        } else if (timer) { clearTimeout(timer); timer = null; }
      }, { threshold: [0, .25, .5, .75, .9, .98, 1] });
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

  // ---- Album ảnh dạng sách lật (flipbook)
  (() => {
    const book = $("#book"), wrap = $("#flipWrap"), prevBtn = $("#flipPrev"), nextBtn = $("#flipNext"), countEl = $("#flipCount");
    if (!book) return;
    const photos = (W.gallery || []).filter(Boolean);
    const mq = matchMedia("(min-width: 760px)");
    let spread = mq.matches; // máy tính: sách mở hai trang; điện thoại: mỗi lần một trang
    let leaves = [], idx = 0;
    // Bìa album mềm mại dễ thương: bìa vàng bơ, nhãn kem viền sóng vẽ tay, hình dán (sao, tim, dấu chân mèo); vẽ bằng SVG nên nét luôn rõ
    const scallop = (x0, y0, x1, y1, r) => {
      const nx = Math.max(2, Math.round((x1 - x0) / (2 * r))), ny = Math.max(2, Math.round((y1 - y0) / (2 * r)));
      const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, f = (n) => n.toFixed(2);
      let d = `M${x0} ${y0}`;
      for (let i = 0; i < nx; i++) d += ` a${f(dx / 2)} ${f(dx / 2)} 0 0 1 ${f(dx)} 0`;
      for (let i = 0; i < ny; i++) d += ` a${f(dy / 2)} ${f(dy / 2)} 0 0 1 0 ${f(dy)}`;
      for (let i = 0; i < nx; i++) d += ` a${f(dx / 2)} ${f(dx / 2)} 0 0 1 ${f(-dx)} 0`;
      for (let i = 0; i < ny; i++) d += ` a${f(dy / 2)} ${f(dy / 2)} 0 0 1 0 ${f(-dy)}`;
      return d + " Z";
    };
    const sparkle = (x, y, s, c) => `<path d="M${x} ${y - s}L${x + s * .28} ${y - s * .28}L${x + s} ${y}L${x + s * .28} ${y + s * .28}L${x} ${y + s}L${x - s * .28} ${y + s * .28}L${x - s} ${y}L${x - s * .28} ${y - s * .28}Z" fill="${c}" stroke="#6b3f1d" stroke-width="1.6" stroke-linejoin="round"/>`;
    const heart = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s / 12})" d="M0 9C-9 3 -9 -6 -4.5 -7.2C-2 -7.8 0 -6 0 -4.2C0 -6 2 -7.8 4.5 -7.2C9 -6 9 3 0 9Z" fill="${c}" stroke="#6b3f1d" stroke-width="${(1.6 * 12 / s).toFixed(2)}" stroke-linejoin="round"/>`;
    const paw = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 12})" fill="#e0a56c" stroke="#6b3f1d" stroke-width="1.5"><ellipse cx="0" cy="4" rx="5.4" ry="4.6"/><circle cx="-6" cy="-1.6" r="2.3"/><circle cx="-2.2" cy="-6" r="2.3"/><circle cx="2.4" cy="-6" r="2.3"/><circle cx="6.2" cy="-1.6" r="2.3"/></g>`;
    const cloud = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M-14 6C-20 6 -20 -2 -14 -2C-14 -9 -4 -10 -1 -4C3 -9 12 -6 11 0C17 0 17 6 11 6Z" fill="#fffdf6" stroke="#6b3f1d" stroke-width="${(1.6 / s).toFixed(2)}" stroke-linejoin="round"/>`;
    const cuteCover = (title, line2, names, foot) => {
      const nm = String(names).replace(/&amp;/g, "&").length;
      const fs = Math.max(15, Math.min(24, 300 / Math.max(nm, 8)));
      const id = "c" + Math.random().toString(36).slice(2, 7);
      return `<div class="pg cover"><svg class="cv" viewBox="0 0 300 400" aria-hidden="true">
        <defs><filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter>
        <filter id="${id}s" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#7a4a10" flood-opacity=".28"/></filter></defs>
        <g filter="url(#${id}s)"><path d="${scallop(50, 44, 274, 356, 9)}" fill="#fffaf0" stroke="#6b3f1d" stroke-width="2.4" stroke-linejoin="round" filter="url(#${id})"/></g>
        <rect x="60" y="54" width="204" height="292" rx="10" fill="none" stroke="#e0b97a" stroke-width="1.6" stroke-dasharray="5 5"/>
        <g filter="url(#${id})">${cloud(112, 92, 1.25)}${cloud(222, 78, .85)}${sparkle(76, 70, 9, "#f6c453")}${sparkle(246, 108, 7, "#f6c453")}${sparkle(238, 322, 8, "#f28b82")}${heart(84, 318, 11, "#f28b82")}${paw(200, 330, 12)}${paw(138, 338, 9)}</g>
        <g text-anchor="middle" fill="#6b3f1d" font-family="'Fuzzy Bubbles', 'Patrick Hand', cursive">
          <text x="162" y="176" font-size="31" font-weight="700">${title}</text>
          <path d="M104 190 q14 -9 29 0 t29 0 t29 0 t29 0" fill="none" stroke="#e0a56c" stroke-width="3" stroke-linecap="round"/>
          <text x="162" y="226" font-size="${fs.toFixed(1)}" font-weight="700" fill="#b5651d">${names}</text>
          <text x="162" y="252" font-size="${Math.min(12.5, 190 / Math.max(String(line2).length, 1) * 1.7).toFixed(1)}">${line2}</text>
          <text x="162" y="290" font-size="13" font-weight="700" letter-spacing="1.2">${foot}</text>
        </g>
      </svg></div>`;
    };
    const dateTxt = esc($("#heroDate").textContent);
    const coverP = cuteCover("Album ảnh", "kỷ niệm của chúng mình", names, dateTxt);
    const tilts = [-1.8, 1.4, -1.0, 1.9, -1.4, 1.1];
    const tapes = ["#f7c9a8", "#f7e08a", "#bfe0c0", "#f4b6c4", "#bcd7ee"];
    const photoP = (src, i) => `<div class="pg photo"><div class="ph" style="--r:${tilts[i % tilts.length]}deg;--tape:${tapes[i % tapes.length]}"><img src="${esc(src)}" alt="Ảnh cưới" loading="lazy" style="object-position:${posOf(src)}"><i class="st s${i % 3}"></i></div><button type="button" class="zoom" data-zoom="${esc(src)}" aria-label="Phóng to ảnh"></button></div>`;
    // trang cuối giống hệt bìa
    const endP = cuteCover("Cảm ơn bạn", "đã xem album của chúng mình", "Hẹn gặp bạn", dateTxt);
    const blankP = `<div class="pg blank"></div>`;

    function build() {
      spread = mq.matches;
      const pages = [coverP, ...photos.map((s, i) => photoP(s, i))];
      if (spread ? pages.length % 2 === 1 : true) pages.push(endP);
      const defs = [];
      if (spread) for (let k = 0; k < pages.length; k += 2) defs.push([pages[k], pages[k + 1]]);
      else {
        // điện thoại: sau ảnh cuối có một trang lót mặt trong bìa cuối (không chữ) lật từ phải sang trái, rồi mới hiện mặt ngoài là lời cảm ơn
        pages.pop();
        pages.forEach((p) => defs.push([p, blankP]));
        defs.push([`<div class="pg endpaper"></div>`, blankP]);
        defs.push([endP, blankP]);
      }
      book.innerHTML = defs.map((d, k) => `<div class="fleaf" data-k="${k}"><div class="face front">${d[0]}</div><div class="face back">${d[1]}</div></div>`).join("");
      leaves = [...book.children];
      idx = Math.min(idx, maxIdx());
      update();
    }
    const maxIdx = () => (spread ? leaves.length : Math.max(0, leaves.length - 1));

    function update() {
      const n = leaves.length;
      leaves.forEach((el, k) => {
        const f = k < idx;
        el.classList.toggle("flipped", f);
        // xếp lớp bằng z-index (an toàn trên Safari): trang chưa lật thì trang đầu nằm trên, trang đã lật thì trang lật sau nằm trên
        el.style.zIndex = String(f ? k : n - k);
        // điện thoại: chỉ cần trang hiện tại và trang kế tiếp, các trang xa hơn ẩn đi
        el.classList.toggle("far", !spread && k > idx + 1);
      });
      book.dataset.state = !spread ? "single" : idx === 0 ? "start" : idx === n ? "end" : "mid";
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx >= maxIdx();
      const total = photos.length;
      let label;
      if (spread) {
        // sách mở hai trang: trang trái là ảnh 2*idx-1, trang phải là ảnh 2*idx
        const l = idx * 2 - 1, r = idx * 2;
        label = idx === 0 ? `Bìa · ${total} ảnh` : l > total ? "Hết album" : r <= total ? `Ảnh ${l}–${r} / ${total}` : `Ảnh ${l} / ${total}`;
      } else {
        label = idx === 0 ? `Bìa · ${total} ảnh` : idx > total ? "Hết album" : `Ảnh ${idx} / ${total}`;
      }
      countEl.textContent = label;
    }
    const go = (d) => { const t = Math.max(0, Math.min(maxIdx(), idx + d)); if (t !== idx) { idx = t; update(); } };
    prevBtn.addEventListener("click", () => go(-1));
    nextBtn.addEventListener("click", () => go(1));

    // bấm hai nửa trang để lật, vuốt ngang để lật, phím mũi tên
    let down = null;
    wrap.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
    wrap.addEventListener("pointerup", (e) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      down = null;
      if (e.target.closest(".zoom")) return;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) return go(dx < 0 ? 1 : -1);
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        const r = wrap.getBoundingClientRect();
        go(e.clientX - r.left > r.width * (spread ? 0.5 : 0.4) ? 1 : -1);
      }
    });
    wrap.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); });
    book.addEventListener("click", (e) => {
      const z = e.target.closest(".zoom");
      if (z) {
        // giải mã ảnh xong rồi mới hiện khung phóng to, để ảnh hiện đủ kích thước ngay, không phóng dần
        const src = z.closest(".pg").querySelector("img");
        openLb(z.dataset.zoom, src ? src.getBoundingClientRect() : null);
      }
    });
    book.addEventListener("error", (e) => { if (e.target.tagName === "IMG") e.target.style.visibility = "hidden"; }, true);
    mq.addEventListener("change", build);
    build();

    // lần đầu cuộn tới album thì tự lật một trang để gợi ý đây là sách lật
    // chỉ lật khi toàn bộ bìa hiện đủ trên màn hình; cuộn đi giữa chừng thì hủy
    let hintTimer = null, hinted = false;
    const fullyVisible = () => { const r = wrap.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 0; };
    const io2 = new IntersectionObserver(() => {
      if (hinted) return;
      if (fullyVisible() && idx === 0) {
        if (!hintTimer) hintTimer = setTimeout(() => { hintTimer = null; if (!hinted && fullyVisible() && idx === 0) { hinted = true; io2.disconnect(); go(1); } }, 900);
      } else if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    }, { threshold: [0, 0.25, 0.5, 0.75, 0.9, 0.98, 1] });
    io2.observe(wrap);
    // người dùng tự lật thì không cần gợi ý nữa
    [prevBtn, nextBtn, wrap].forEach((el) => el.addEventListener("pointerdown", () => { hinted = true; if (hintTimer) clearTimeout(hintTimer); }, { once: true }));
  })();
  lb.addEventListener("click", closeLb);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  // Lời chúc của khách mời: các tờ giấy note dán, nhập trong editor
  (() => {
    const wrap = $("#wishesWrap"), box = $("#wishes");
    const list = (W.wishes || []).filter((w) => w && String(w.text || "").trim());
    wrap.hidden = !list.length;
    const colors = ["#fff1b8", "#ffd9c9", "#e4efc9", "#fde1ec", "#e3ecf7"], tapes = ["rgba(246,196,160,.9)", "rgba(247,224,138,.9)", "rgba(191,224,192,.9)", "rgba(244,182,196,.9)", "rgba(188,215,238,.9)"];
    const rots = [-2.2, 1.6, -1.2, 2.1, -1.8, 1.0];
    box.innerHTML = list.map((w, i) => `<figure class="note" style="--nc:${colors[i % colors.length]};--nt:${tapes[(i + 2) % tapes.length]};--nr:${rots[i % rots.length]}deg"><p>${esc(w.text)}</p>${String(w.name || "").trim() ? `<cite>${esc(w.name)}</cite>` : ""}</figure>`).join("");
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
  tick(); setInterval(tick, 1000);

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
  if (preview && !params.get("intro")) {
    env.remove();
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
    $("#envNames").innerHTML = `${esc(W.groom.name)} &amp; ${esc(W.bride.name)}`;
    $("#envDate").textContent = (W.introDate || "").trim() || $("#heroDate").textContent;
    $("#envGuest").textContent = `Thân mời: ${guest || "Quý khách"}`;
    $("#letterNames").textContent = guest || "Quý khách";
    let opened = false;
    const openIt = () => {
      if (opened) return;
      opened = true;
      env.classList.add("open");
      if (W.music) audio.play().catch(() => {});
      setTimeout(() => {
        env.classList.add("leaving");
        document.body.classList.remove("locked");
        setTimeout(() => env.remove(), 900);
      }, 2700);
    };
    $(".env").addEventListener("click", openIt);
  }

  // Lá vàng rơi nhè nhẹ
  (() => {
    const box = $("#leaves");
    if (!box) return;
    const colors = ["#e0a63a", "#d18f26", "#e9bd5c", "#c97b1d"];
    const svg = (c) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 32'><path d='M12 1C5 8 3 18 12 31C21 18 19 8 12 1Z' fill='${c}'/><path d='M12 4V29' stroke='rgba(120,70,10,.45)' stroke-width='1' fill='none'/></svg>`)}")`;
    const n = innerWidth < 600 ? 9 : 14;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("span");
      el.className = "leaf";
      const size = 9 + Math.random() * 9;
      el.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;width:${size.toFixed(1)}px;height:${(size * 1.3).toFixed(1)}px;--d:${(14 + Math.random() * 10).toFixed(1)}s;--delay:${(-Math.random() * 22).toFixed(1)}s;--drift:${(Math.random() * 160 - 80).toFixed(0)}px;--rot:${(180 + Math.random() * 360).toFixed(0)}deg;--sway:${(3 + Math.random() * 3).toFixed(1)}s;opacity:${(0.3 + Math.random() * 0.3).toFixed(2)}`;
      const leaf = document.createElement("i");
      leaf.style.backgroundImage = svg(colors[i % colors.length]);
      el.appendChild(leaf);
      box.appendChild(el);
    }
  })();

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("show"); io.unobserve(en.target); }
  }), { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // RSVP
  $("#rsvp").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const msg = $("#rsvpMsg");
    msg.textContent = "Đang gửi...";
    try {
      if (W.rsvpEndpoint) {
        await fetch(W.rsvpEndpoint, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) });
      } else {
        try { localStorage.setItem("rsvp", JSON.stringify(data)); } catch {}
      }
      msg.textContent = `Cảm ơn ${data.name}! Chúng mình đã nhận được xác nhận của bạn.`;
      e.target.reset();
    } catch {
      msg.textContent = "Có lỗi xảy ra, bạn vui lòng thử lại nhé.";
    }
  });
})();
