(function () {
  const params = new URLSearchParams(location.search);
  const preview = params.get("preview");
  let W = window.WEDDING;
  if (preview) {
    try { const d = localStorage.getItem("wedding_draft"); if (d) W = JSON.parse(d); } catch {}
  }
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const names = `${W.groom.name} &amp; ${W.bride.name}`;

  document.title = `Thiệp Cưới ${W.groom.name} & ${W.bride.name}`;
  document.querySelectorAll("[data-names]").forEach((el) => (el.innerHTML = names));

  const date = new Date(W.date);
  $("#heroDate").textContent = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).replace(/\//g, " . ");
  $("#quote").textContent = W.quote;
  $("#groomName").textContent = W.groom.fullName;
  $("#brideName").textContent = W.bride.fullName;
  $("#groomParents").textContent = W.groom.parents;
  $("#brideParents").textContent = W.bride.parents;

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

  $("#gallery").innerHTML = W.gallery.map((src) => `<img src="${esc(src)}" alt="Ảnh cưới" loading="lazy">`).join("");
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
    audio.src = W.music; mBtn.hidden = false;
    mBtn.addEventListener("click", () => (audio.paused ? audio.play() : audio.pause()));
    audio.addEventListener("play", () => mBtn.classList.add("playing"));
    audio.addEventListener("pause", () => mBtn.classList.remove("playing"));
  }

  // Envelope
  const guest = params.get("to");
  if (guest) document.querySelector(".envelope-card .small").textContent = `Thân mời ${guest}`;
  if (preview) $("#envelope").remove();
  else document.body.classList.add("locked");
  $("#openBtn") && $("#openBtn").addEventListener("click", () => {
    $("#envelope").classList.add("open");
    document.body.classList.remove("locked");
    if (W.music) audio.play().catch(() => {});
  });

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
