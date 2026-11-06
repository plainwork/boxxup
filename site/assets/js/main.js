// Progressive enhancement: the deploy intro, the theme modal, keys and copy.
// Every page works without it.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  /* ---------- flash, like the TUI's ✓ messages ---------- */
  const flashEl = $("[data-flash]");
  let flashTimer;
  function flash(ok, rest = "", ms = 0) {
    if (!flashEl) return;
    clearTimeout(flashTimer);
    const b = document.createElement("span");
    b.className = "ok";
    b.textContent = ok;
    flashEl.replaceChildren(b, document.createTextNode(rest ? " " + rest : ""));
    if (ms) flashTimer = setTimeout(() => flashEl.replaceChildren(), ms);
  }

  /* ---------- the KITT scanner, ported from tui/loading.go ---------- */
  const tri = (x, period) => {
    x = ((x % period) + period) % period;
    const half = period >> 1;
    return x < half ? x : period - 1 - x;
  };
  const glyph = (c, frame) => {
    let seed = ((c * 31) ^ ((frame >> 2) * 17)) & 0xff;
    if (seed < 16) seed += 0x50;
    return seed;
  };
  // Braille bit → dot [col, row] in its 2×4 cell.
  const DOTS = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [0, 3], [1, 3]];

  function scanner(canvas) {
    const ctx = canvas.getContext("2d");
    let cols = 0, cw = 0, lh = 0;
    function size() {
      const probe = document.createElement("span");
      probe.textContent = "0".repeat(10);
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
      canvas.parentNode.append(probe);
      const r = probe.getBoundingClientRect();
      probe.remove();
      cw = r.width / 10;
      lh = r.height;
      const avail = canvas.closest(".stage").clientWidth;
      cols = Math.max(12, Math.min(68, Math.floor(avail / cw) - 2));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cols * cw * dpr);
      canvas.height = Math.round(lh * dpr);
      canvas.style.width = cols * cw + "px";
      canvas.style.height = lh + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(frame) {
      const colors = [css("--kitt-0"), css("--kitt-3"), css("--kitt-2"), css("--kitt-1")];
      const head = tri(frame * 4, cols * 2);
      const r = Math.max(1, cw * 0.15);
      const top = (lh - cw * 1.6) / 2; // the braille cell is about 1.6ch tall
      ctx.clearRect(0, 0, cols * cw, lh);
      for (let c = 0; c < cols; c++) {
        const dist = Math.abs(c - head);
        const bits = dist === 0 ? 0xff : glyph(c, frame);
        ctx.fillStyle = colors[dist <= 2 ? 3 : dist <= 5 ? 2 : dist <= 9 ? 1 : 0];
        for (let b = 0; b < 8; b++) {
          if (!(bits & (1 << b))) continue;
          const [dx, dy] = DOTS[b];
          ctx.beginPath();
          ctx.arc(c * cw + cw * (0.3 + dx * 0.4), top + cw * (0.2 + dy * 0.4), r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    size();
    return { size, draw };
  }

  /* ---------- the deploy intro (home only) ---------- */
  function intro() {
    const loader = $(".loader");
    if (!loader) return;
    const step = $(".loader-step", loader);
    const steps = JSON.parse(loader.dataset.steps || "[]");
    const sc = scanner($(".scanner", loader));
    let frame = 0, done = false, stepAt = 0;
    const tick = setInterval(() => sc.draw(frame++), 70); // the TUI's 70 ms tick
    sc.draw(frame++);
    const stepTick = setInterval(() => {
      stepAt = Math.min(stepAt + 1, steps.length - 1);
      step.textContent = steps[stepAt];
    }, 480);
    addEventListener("resize", sc.size);

    const timers = [];
    function reveal(fast) {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      clearInterval(stepTick);
      if (fast) root.classList.add("skipped");
      root.classList.add("go");
      setTimeout(() => flash("✓ deployed:", "boxx", 6000), fast ? 150 : 900);
      setTimeout(() => {
        clearInterval(tick);
        removeEventListener("resize", sc.size);
        root.classList.remove("intro", "go", "skipped");
      }, fast ? 400 : 1600);
    }
    timers.push(setTimeout(() => reveal(false), 2600));
    const skip = () => reveal(true);
    addEventListener("keydown", skip, { once: true });
    addEventListener("pointerdown", skip, { once: true });
  }
  if (root.classList.contains("intro")) intro();

  /* ---------- themes ---------- */
  const KEY = "boxx-theme";
  const stored = () => { try { return localStorage.getItem(KEY) || "auto"; } catch { return "auto"; } };
  const apply = (id) => { if (id === "auto") delete root.dataset.theme; else root.dataset.theme = id; };

  const modal = $("#theme-modal");
  const themeBtn = $("#theme-btn");
  const options = modal ? $$("[data-theme-id]", modal) : [];
  let before = stored(), cur = 0;

  function mark(id) { options.forEach((o) => o.setAttribute("aria-checked", String(o.dataset.themeId === id))); }
  function move(i) {
    cur = (i + options.length) % options.length;
    options.forEach((o, n) => n === cur ? o.setAttribute("data-cur", "") : o.removeAttribute("data-cur"));
    options[cur].focus();
    apply(options[cur].dataset.themeId); // live preview
  }
  function openTheme() {
    before = stored();
    mark(before);
    modal.hidden = false;
    themeBtn.setAttribute("aria-expanded", "true");
    move(Math.max(0, options.findIndex((o) => o.dataset.themeId === before)));
  }
  function closeTheme(pick) {
    if (pick) {
      try { localStorage.setItem(KEY, pick); } catch {}
      apply(pick);
      mark(pick);
      flash("✓ theme:", options.find((o) => o.dataset.themeId === pick).querySelector(".name").textContent, 3000);
    } else apply(before);
    modal.hidden = true;
    themeBtn.setAttribute("aria-expanded", "false");
    themeBtn.focus();
  }
  if (modal) {
    themeBtn.addEventListener("click", openTheme);
    options.forEach((o, i) => {
      o.addEventListener("click", () => closeTheme(o.dataset.themeId));
      o.addEventListener("mouseenter", () => move(i));
    });
    modal.addEventListener("click", (e) => { if (e.target === modal) closeTheme(null); });
    modal.addEventListener("keydown", (e) => {
      const k = e.key;
      if (k === "Escape" || k === "q") closeTheme(null);
      else if (k === "ArrowDown" || k === "j" || (k === "Tab" && !e.shiftKey)) move(cur + 1);
      else if (k === "ArrowUp" || k === "k" || (k === "Tab" && e.shiftKey)) move(cur - 1);
      else if (k === "Enter" || k === " ") closeTheme(options[cur].dataset.themeId);
      else return;
      e.preventDefault();
      e.stopPropagation();
    });
  }

  /* ---------- copy ---------- */
  const copyBtn = $("[data-copy]");
  async function copy() {
    const text = $("[data-copy-src]").textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const r = document.createRange();
      r.selectNodeContents($("[data-copy-src]"));
      getSelection().removeAllRanges();
      getSelection().addRange(r);
      document.execCommand("copy");
    }
    flash("✓ copied:", "install command", 3000);
  }
  copyBtn?.addEventListener("click", copy);

  /* ---------- keys ---------- */
  addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (modal && !modal.hidden) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    const k = e.key;
    const link = $(`.keybar a[data-key="${CSS.escape(k)}"]`);
    if (link) { e.preventDefault(); link.click(); return; }
    if (k === "t" && modal) { e.preventDefault(); openTheme(); }
    else if (k === "c" && copyBtn) { e.preventDefault(); copy(); }
    else if (k === "h") { location.href = "/"; }
    else if (k === "j") window.scrollBy({ top: 64 });
    else if (k === "k") window.scrollBy({ top: -64 });
  });

  /* ---------- docs: mark the section in view ---------- */
  const toc = $$(".toc a");
  if (toc.length && "IntersectionObserver" in window) {
    const byId = new Map(toc.map((a) => [a.hash.slice(1), a]));
    const obs = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        toc.forEach((a) => a.removeAttribute("aria-current"));
        byId.get(en.target.id)?.setAttribute("aria-current", "true");
      }
    }, { rootMargin: "-20% 0px -70% 0px" });
    $$(".docs-body .panel").forEach((p) => obs.observe(p));
  }
})();
