// Màu chủ đề cho các trang nền màu (trang 3, 5, 7): từ một màu nền {h,s,l} tính ra toàn bộ màu chữ và họa tiết cho dễ đọc
(function () {
  const DEFAULT = { h: 350, s: 59, l: 27 };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v) || 0));
  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
  const lum = ([r, g, b]) => { const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  function themeVars(t) {
    t = t || DEFAULT;
    const h = clamp(t.h, 0, 360), s = clamp(t.s, 0, 100), l = clamp(t.l, 8, 88);
    const dark = lum(hslToRgb(h, s, l)) < 0.3;
    const hsl = (hh, ss, ll) => `hsl(${Math.round(hh)} ${Math.round(ss)}% ${Math.round(ll)}%)`;
    const v = { "--th-bg": hsl(h, s, l), "--th-bg2": hsl(h, s, Math.min(l + 11, 94)), "--th-bg3": hsl(h, s, Math.max(l - 9, 4)) };
    if (dark) Object.assign(v, { "--th-text": "#fbefd5", "--th-title": "#f8e6b8", "--th-accent": "#f2c46d", "--th-soft": "#ebcb8a", "--th-quote": "#f3dcae", "--th-hon": "#d4b08c", "--th-panel": "rgba(20, 0, 4, .17)", "--th-stroke": "#4a2a14", "--th-img": 'url("images/paper-dark.webp")', "--th-bm": "normal" });
    else Object.assign(v, { "--th-text": hsl(h, 45, 14), "--th-title": hsl(h, 60, 15), "--th-accent": hsl(h, 70, 21), "--th-soft": hsl(h, 38, 27), "--th-quote": hsl(h, 45, 16), "--th-hon": hsl(h, 28, 33), "--th-panel": "rgba(255, 255, 255, .3)", "--th-stroke": "#fff6e2", "--th-img": 'url("images/paper.webp")', "--th-bm": "multiply" });
    v.dark = dark;
    return v;
  }
  function applyTheme(t, el) {
    const v = themeVars(t), st = (el || document.documentElement).style;
    Object.keys(v).forEach((k) => { if (k.startsWith("--")) st.setProperty(k, v[k]); });
  }
  window.themeVars = themeVars;
  window.applyTheme = applyTheme;
  window.THEME_DEFAULT = DEFAULT;
})();
