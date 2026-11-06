// Renders the static pages into site/ from src/content.mjs.
// Run with `npm run build` (this, then Tailwind).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { site, deploySteps, features, docs } from "./content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "site");

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// [id, name, note, swatches]. "auto" follows the OS between dark and light.
export const THEMES = [
  ["auto", "auto", "dark or light, from your OS", ["#0b0f19", "#ffffff"]],
  ["dark", "boxx dark", "the TUI on a dark terminal", ["#0b0f19", "#60a5fa", "#1d4ed8"]],
  ["light", "boxx light", "the TUI on a light terminal", ["#ffffff", "#1d4ed8", "#6b7280"]],
  ["mocha", "mocha", "Catppuccin Mocha", ["#1e1e2e", "#89b4fa", "#cba6f7"]],
  ["phosphor", "phosphor", "green CRT", ["#050d07", "#33ff66", "#138a3a"]],
  ["amber", "amber", "amber CRT", ["#0d0800", "#ffb000", "#8a5c00"]],
  ["borland", "borland", "blue screen, cyan bars", ["#0000aa", "#00aaaa", "#ffff55"]],
];

/* ---------- the 8-bit BOXX ----------
   7 rows per letter. Rows are banded top to bottom (logo-1, -2, -3) with a
   one-pixel drop shadow, drawn as one path per colour so it stays crisp. */
const GLYPHS = {
  B: ["######.", "##...##", "##...##", "######.", "##...##", "##...##", "######."],
  O: [".#####.", "##...##", "##...##", "##...##", "##...##", "##...##", ".#####."],
  X: ["##...##", "##...##", ".##.##.", "..###..", ".##.##.", "##...##", "##...##"],
};
const BAND = [1, 1, 2, 2, 2, 3, 3];

function pixels(word) {
  const px = [];
  [...word].forEach((ch, i) => GLYPHS[ch].forEach((row, y) => [...row].forEach((c, x) => {
    if (c === "#") px.push([i * 8 + x, y]);
  })));
  return { px, w: word.length * 8 - 1 };
}

function logoSvg(word = "BOXX") {
  const { px, w } = pixels(word);
  const d = (list, dx = 0, dy = 0) => list.map(([x, y]) => `M${x + dx} ${y + dy}h1v1h-1z`).join("");
  const band = (n) => px.filter(([, y]) => BAND[y] === n);
  return `<svg class="logo" viewBox="0 0 ${w + 1} 8" role="img" aria-label="boxx" shape-rendering="crispEdges">
    <path class="logo-sh" d="${d(px, 1, 1)}"/>
    <path class="logo-1" d="${d(band(1))}"/>
    <path class="logo-2" d="${d(band(2))}"/>
    <path class="logo-3" d="${d(band(3))}"/>
  </svg>`;
}

// Favicon: the B, banded, on the dark background.
function favicon() {
  const rows = GLYPHS.B;
  const fill = ["", "%2393c5fd", "%2360a5fa", "%233b82f6"];
  let paths = "";
  for (const n of [1, 2, 3]) {
    const d = rows.flatMap((row, y) => BAND[y] !== n ? [] : [...row].flatMap((c, x) => c === "#" ? [`M${x + 1} ${y + 1}h1v1h-1z`] : [])).join("");
    paths += `%3Cpath fill='${fill[n]}' d='${d}'/%3E`;
  }
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Crect width='9' height='9' fill='%230b0f19'/%3E${paths}%3C/svg%3E`;
}

/* ---------- shell ---------- */

const NAV = [
  ["f", "features", "/features/"],
  ["d", "docs", "/docs/"],
  ["g", "github", site.repo],
];

const key = (k, label) => `<span class="key">${esc(k)}</span> ${esc(label)}`;
const sep = `<span class="sep" aria-hidden="true">·</span>`;

// Plays the deploy intro on a fresh visit or a reload, not when arriving from another page here.
const INTRO = `(function(){try{var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var n=performance.getEntriesByType("navigation")[0];var here=document.referrer&&new URL(document.referrer).origin===location.origin;if(here&&!(n&&n.type==="reload"))return;d.classList.add("intro");setTimeout(function(){d.classList.remove("intro")},9000)}catch(e){}})()`;

function shell({ title, description, path, body, hints, intro = false }) {
  const nav = NAV.map(([k, label, href]) => {
    const ext = href.startsWith("http");
    const cur = href === path ? ' aria-current="page"' : "";
    return `<a href="${href}" data-key="${k}"${cur}${ext ? ' target="_blank" rel="noopener"' : ""} aria-keyshortcuts="${k}">${key(k, label)}</a>`;
  });
  nav.push(`<button type="button" data-key="t" id="theme-btn" aria-haspopup="dialog" aria-controls="theme-modal" aria-keyshortcuts="t">${key("t", "theme")}</button>`);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${path ? `<link rel="canonical" href="${site.url}${path}">
<meta property="og:url" content="${site.url}${path}">` : `<meta name="robots" content="noindex">`}
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0f19" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${favicon()}">
<link rel="preload" href="/assets/fonts/jetbrainsmono-400.woff2" as="font" type="font/woff2" crossorigin>
<script>try{var t=localStorage.getItem("boxx-theme");if(t&&t!=="auto")document.documentElement.dataset.theme=t}catch(e){}</script>
${intro ? `<script>${INTRO}</script>\n` : ""}<link rel="stylesheet" href="/assets/css/site.css">
<script src="/assets/js/main.js" defer></script>
</head>
<body data-page="${esc(path)}">
<a href="#main" class="skip">skip to content</a>
<header class="titlebar">
  <a href="/" class="titlebar-name">${esc(site.name)}</a> <span class="titlebar-version">[${esc(site.boxxVersion)}]</span>
</header>
<nav class="keybar" aria-label="Sections">
  ${nav.join(`\n  ${sep}\n  `)}
</nav>
<main id="main">
${body}
</main>
<footer class="statusbar">
  <span class="note">${site.note.split(" · ").map((s) => `<span class="whitespace-nowrap">${esc(s)}</span>`).join(" · ")}</span>
  <span class="flash" data-flash role="status" aria-live="polite"></span>
  <span class="hints">${hints.map(([k, l]) => key(k, l)).join(` ${sep} `)}</span>
</footer>
<div class="modal-wrap" id="theme-modal" hidden>
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="theme-title">
    <h2 class="modal-title" id="theme-title">theme</h2>
    <div class="modal-list" role="radiogroup" aria-labelledby="theme-title">
      ${THEMES.map(([id, name, note, sw]) => `<button type="button" role="radio" aria-checked="false" data-theme-id="${id}"><span class="dot" aria-hidden="true"></span><span class="name">${esc(name)}</span><span class="note">${esc(note)}</span><span class="sw" aria-hidden="true">${sw.map((c) => `<i style="background:${c}"></i>`).join("")}</span></button>`).join("\n      ")}
    </div>
    <p class="modal-keys">${[["↑/k", "up"], ["↓/j", "down"], ["enter", "pick"], ["esc", "cancel"]].map(([k, l]) => key(k, l)).join(` ${sep} `)}</p>
  </div>
</div>
<div class="modal-wrap" id="copy-modal" hidden>
  <div class="modal modal--note" role="alertdialog" aria-modal="true" aria-labelledby="copy-title" aria-describedby="copy-body">
    <h2 class="modal-title" id="copy-title">before you run it</h2>
    <div class="modal-body" id="copy-body">
      <p><span class="ok">✓</span> copied to your clipboard</p>
      ${site.disclaimer.map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
    </div>
    <p class="modal-actions">
      <a class="btn" href="https://get.boxxup.com" target="_blank" rel="noopener" data-note-key="i" aria-keyshortcuts="i"><span class="u">i</span>nstaller src</a>
      <a class="btn" href="${site.repo}" target="_blank" rel="noopener" data-note-key="b" aria-keyshortcuts="b"><span class="u">b</span>oxx src</a>
      <button type="button" class="btn btn--primary" data-close data-note-key="g" aria-keyshortcuts="g"><span class="u">g</span>ot it</button>
    </p>
    <p class="modal-keys">${[["enter", "got it"], ["esc", "close"]].map(([k, l]) => key(k, l)).join(` ${sep} `)}</p>
  </div>
</div>
</body>
</html>
`;
}

/* ---------- pages ---------- */

function codeLines(lines) {
  return `<pre class="code">${lines.map(([p, cmd, note]) =>
    `<span class="prompt">${esc(p)}</span> ${esc(cmd)}${note ? `  <span class="comment"># ${esc(note)}</span>` : ""}`).join("\n")}</pre>`;
}

const home = () => shell({
  title: "boxx: deploy Docker apps to one Linux host",
  description: site.pitch,
  path: "/",
  intro: true,
  hints: [["c", "copy install"], ["t", "theme"]],
  body: `<section class="hero">
  <h1 class="stage">
    ${logoSvg()}
    <span class="loader" aria-hidden="true" data-steps="${esc(JSON.stringify(deploySteps))}">
      <span class="loader-label">deploying boxx…</span>
      <canvas class="scanner"></canvas>
      <span class="loader-step">${esc(deploySteps[0])}</span>
    </span>
  </h1>
  <p class="pitch reveal">${esc(site.pitch)}</p>
  <div class="term reveal" id="install">
    <h2 class="term-title">install</h2>
    <div class="term-body">
      <code class="term-cmd"><span class="prompt" aria-hidden="true">$ </span><span data-copy-src>${esc(site.install)}</span></code>
      <button type="button" class="copy" data-copy aria-keyshortcuts="c">${key("c", "copy")}</button>
    </div>
  </div>
  <p class="then reveal"><span class="muted">then</span> <code>${esc(site.next)}</code></p>
</section>`,
});

const featuresPage = () => shell({
  title: "features · boxx",
  description: "What boxx does: HTTPS per hostname, zero-downtime deploys, databases on request, storage, groups and updates.",
  path: "/features/",
  hints: [["j/k", "scroll"], ["t", "theme"]],
  body: `<h1 class="page-title">features</h1>
<div class="panels">
${features.map((f) => `  <section class="panel" id="${f.id}">
    <h2 class="panel-title"><span class="dot" aria-hidden="true"></span>${esc(f.name)}</h2>
    <p>${esc(f.body)}</p>${f.code ? `\n    ${codeLines([["$", f.code]])}` : ""}
  </section>`).join("\n")}
</div>`,
});

const docsPage = () => shell({
  title: "docs · boxx",
  description: "Install boxx, deploy your first app, and manage hostnames, env and the host.",
  path: "/docs/",
  hints: [["j/k", "scroll"], ["t", "theme"]],
  body: `<h1 class="page-title">docs</h1>
<div class="docs">
  <nav class="toc" aria-label="On this page">
    <h2 class="panel-title">contents</h2>
    <ol>
${docs.map((d) => `      <li><a href="#${d.id}">${esc(d.name)}</a></li>`).join("\n")}
    </ol>
  </nav>
  <div class="docs-body">
${docs.map((d) => `    <section class="panel" id="${d.id}">
      <h2 class="panel-title"><span class="dot" aria-hidden="true"></span>${esc(d.name)}</h2>
      <p>${esc(d.body)}</p>${d.code ? `\n      ${codeLines(d.code)}` : ""}
    </section>`).join("\n")}
  </div>
</div>`,
});

function write(rel, html) {
  const out = join(ROOT, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

// nginx serves this for any missing page, so it links with absolute paths and has no canonical URL.
const notFound = () => shell({
  title: "not found · boxx",
  description: "That page isn't here.",
  path: "",
  hints: [["h", "home"], ["t", "theme"]],
  body: `<section class="hero">
  <div class="term" role="alert">
    <h1 class="term-title">404</h1>
    <p><span class="bad">✗</span> no route for that path</p>
    <p class="muted">boxx couldn't find it. Try <a href="/">home</a>, <a href="/features/">features</a> or <a href="/docs/">docs</a>.</p>
  </div>
</section>`,
});

write("index.html", home());
write("404.html", notFound());
write("features/index.html", featuresPage());
write("docs/index.html", docsPage());
console.log("build: wrote index.html, features/, docs/, 404.html");
