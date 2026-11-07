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
  const posOf = (u) => { const v = (W.imgPos && W.imgPos[u]) || ""; return /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(v) ? v : "50% 50%"; };

  document.title = `Thiệp Cưới ${W.groom.name} & ${W.bride.name}`;
  document.querySelectorAll("[data-names]").forEach((el) => (el.innerHTML = names));

  const date = new Date(W.date);
  $("#heroDate").textContent = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).replace(/\//g, " . ");
  $("#quote").textContent = W.quote;
  if (W.cover) {
    $(".hero").style.backgroundImage = `linear-gradient(rgba(253,246,229,.45), rgba(253,246,229,.55) 55%, rgba(253,246,229,.82)), url('${String(W.cover).replace(/'/g, "%27")}')`;
    $(".hero").style.backgroundPosition = `0% 0%, ${posOf(W.cover)}`;
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

  $("#gallery").innerHTML = W.gallery.map((src) => `<img src="${esc(src)}" alt="Ảnh cưới" loading="lazy" style="object-position:${posOf(src)}">`).join("");
  const lb = $("#lightbox");
  $("#gallery").addEventListener("click", (e) => {
    if (e.target.tagName === "IMG") { lb.querySelector("img").src = e.target.src; lb.hidden = false; }
  });
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
    if (W.introBg) {
      env.style.backgroundImage = `linear-gradient(rgba(255,255,255,.12), rgba(60,40,30,.18)), url('${String(W.introBg).replace(/'/g, "%27")}')`;
      env.style.backgroundPosition = posOf(W.introBg);
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
