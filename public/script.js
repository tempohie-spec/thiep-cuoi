(async function () {
  const params = new URLSearchParams(location.search);
  const preview = params.get("preview");
  let W = window.WEDDING;
  if (preview) {
    try { const d = localStorage.getItem("wedding_draft"); if (d) W = { ...window.WEDDING, ...JSON.parse(d) }; } catch {}
  } else {
    // Lấy nội dung đã đăng từ editor (nếu có), không có thì dùng config.js
    try {
      // ?fresh=1 bỏ qua bộ nhớ đệm để chủ thiệp xem ngay bản vừa đăng
      const r = await fetch(params.get("fresh") ? "/api/config?t=" + Date.now() : "/api/config", { cache: "no-store" });
      if (r.ok) { const d = await r.json(); if (d && d.groom && d.bride) W = { ...window.WEDDING, ...d }; }
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

  $("#events").innerHTML = W.events.map((e) => `
    <div class="event">
      <h3>${esc(e.title)}</h3>
      <p class="time">${esc(e.time)}</p>
      <p class="lunar">${esc(e.lunar || "")}</p>
      <p class="place">${esc(e.place)}</p>
      <p class="addr">${esc(e.address)}</p>
      ${e.map ? `<a href="${esc(e.map)}" target="_blank" rel="noopener">Xem bản đồ</a>` : ""}
    </div>`).join("");

  $("#story").innerHTML = W.story.map((s) => `
    <div class="tl-item">
      <p class="year">${esc(s.year)}</p>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
    </div>`).join("");

  const lb = $("#lightbox");

  // ---- Album ảnh dạng sách lật (flipbook)
  (() => {
    const book = $("#book"), wrap = $("#flipWrap"), prevBtn = $("#flipPrev"), nextBtn = $("#flipNext"), countEl = $("#flipCount");
    if (!book) return;
    const photos = (W.gallery || []).filter(Boolean);
    const mq = matchMedia("(min-width: 760px)");
    let spread = mq.matches; // máy tính: sách mở hai trang; điện thoại: mỗi lần một trang
    let leaves = [], idx = 0;
    // Bìa da nâu với viền, hoa văn và chữ vàng dập nổi (vẽ bằng SVG, rõ nét ở mọi kích thước)
    const gold = "url(#GOLD)";
    const sawtooth = (x0, y0, x1, y1, amp) => {
      // đường răng cưa chạy quanh khung chữ nhật, răng hướng vào trong
      const pts = [];
      const side = (ax, ay, bx, by, nx, ny) => {
        const len = Math.hypot(bx - ax, by - ay), n = 2 * Math.round(len / 28);
        for (let i = 0; i < n; i++) { const t = i / n, o = i % 2 ? amp : 0; pts.push([ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o]); }
      };
      side(x0, y0, x1, y0, 0, 1); side(x1, y0, x1, y1, -1, 0); side(x1, y1, x0, y1, 0, -1); side(x0, y1, x0, y0, 1, 0);
      return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + " Z";
    };
    const flourish = `<g fill="none" stroke="${gold}" stroke-width="2.1" stroke-linecap="round">
        <path d="M6 72 C6 42 24 22 52 20 C70 19 82 30 78 44 C75 56 60 58 54 49 C50 42 56 35 63 38"/>
        <path d="M6 72 C10 58 20 50 34 48 C44 47 50 54 46 61 C43 66 36 65 35 60"/>
        <path d="M6 72 C4 80 8 88 14 92"/>
        <path d="M54 20 C64 8 80 6 92 12" stroke-width="1.6"/>
      </g>
      <g fill="${gold}"><path d="M30 26 C36 15 49 13 58 17 C50 23 39 28 30 26Z"/><path d="M12 48 C4 41 3 29 8 21 C16 27 18 39 12 48Z"/><path d="M60 8 C66 2 76 2 82 6 C76 10 68 11 60 8Z"/><circle cx="92" cy="12" r="2.6"/><circle cx="14" cy="92" r="2.4"/><circle cx="63" cy="38" r="2"/></g>`;
    const leather = (title, sub, script, foot) => {
      const id = "g" + Math.random().toString(36).slice(2, 8);
      const nm = String(script).replace(/&amp;/g, "&").length;
      const fs = Math.max(17, Math.min(31, 560 / Math.max(nm, 8)));
      // dòng chữ nhỏ dài thì thu nhỏ và giảm giãn chữ để không chạm viền
      const subLong = sub.length > 16, subFs = subLong ? 7 : 8.6, subLs = subLong ? 1.4 : 2.6;
      return `<div class="pg cover"><svg class="cv" viewBox="0 0 300 400" aria-hidden="true">
        <defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8e6a8"/><stop offset=".45" stop-color="#c9983c"/><stop offset=".75" stop-color="#e9c872"/><stop offset="1" stop-color="#b98428"/></linearGradient>
          <filter id="${id}e" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx=".7" dy=".9" stdDeviation=".45" flood-color="#1a0802" flood-opacity=".85"/></filter>
        </defs>
        <g filter="url(#${id}e)" fill="none" stroke="url(#${id})">
          <rect x="14" y="14" width="272" height="372" rx="10" stroke-width="2.4"/>
          <rect x="20" y="20" width="260" height="360" rx="7" stroke-width="1"/>
          <rect x="27" y="27" width="246" height="346" rx="5" stroke-width="4.2" stroke-linecap="round" stroke-dasharray="0.1 9"/>
          <path d="${sawtooth(38, 38, 262, 362, 7)}" stroke-width="1.3" stroke-linejoin="round"/>
          <g transform="translate(18 18)">${flourish.replace(/GOLD/g, id)}</g>
          <g transform="translate(282 18) scale(-1 1)">${flourish.replace(/GOLD/g, id)}</g>
          <g transform="translate(18 382) scale(.62 -.62)">${flourish.replace(/GOLD/g, id)}</g>
          <g transform="translate(282 382) scale(-.62 -.62)">${flourish.replace(/GOLD/g, id)}</g>
          <path d="M96 205 H132 M168 205 H204" stroke-width="1.2"/><path d="M150 199 L156 205 L150 211 L144 205 Z" fill="url(#${id})" stroke-width=".6"/>
        </g>
        <g filter="url(#${id}e)" fill="url(#${id})" text-anchor="middle">
          <text x="150" y="160" font-family="'Playfair Display', serif" font-weight="700" font-size="23" letter-spacing="4">${title}</text>
          <text x="150" y="184" font-family="'Playfair Display', serif" font-weight="600" font-size="${subFs}" letter-spacing="${subLs}">${sub}</text>
          <text x="150" y="248" font-family="'Great Vibes', cursive" font-size="${fs.toFixed(1)}">${script}</text>
          <text x="150" y="338" font-family="'Playfair Display', serif" font-weight="700" font-size="11.5" letter-spacing="3">${foot}</text>
        </g>
      </svg></div>`;
    };
    const dateTxt = esc($("#heroDate").textContent);
    const coverP = leather("ALBUM ẢNH", "NGÀY ĐẶC BIỆT", names, dateTxt);
    const tilts = [-1.4, 1.1, -0.8, 1.6, -1.1, 0.9];
    const photoP = (src, i) => `<div class="pg photo"><div class="ph" style="--r:${tilts[i % tilts.length]}deg"><img src="${esc(src)}" alt="Ảnh cưới" loading="lazy" style="object-position:${posOf(src)}"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div><button type="button" class="zoom" data-zoom="${esc(src)}" aria-label="Phóng to ảnh"></button></div>`;
    // trang cuối giống hệt bìa
    const endP = leather("CẢM ƠN BẠN", "ĐÃ XEM ALBUM CỦA CHÚNG MÌNH", "Hẹn gặp bạn", dateTxt);
    const blankP = `<div class="pg blank"></div>`;

    function build() {
      spread = mq.matches;
      const pages = [coverP, ...photos.map((s, i) => photoP(s, i))];
      if (spread ? pages.length % 2 === 1 : true) pages.push(endP);
      const defs = [];
      if (spread) for (let k = 0; k < pages.length; k += 2) defs.push([pages[k], pages[k + 1]]);
      else pages.forEach((p) => defs.push([p, blankP]));
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
        const url = z.dataset.zoom, li = lb.querySelector("img");
        const show = () => { li.src = url; lb.hidden = false; };
        const pre = new Image();
        pre.decoding = "sync";
        pre.src = url;
        (pre.decode ? pre.decode() : Promise.resolve()).then(show, show);
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
  lb.addEventListener("click", () => (lb.hidden = true));

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
