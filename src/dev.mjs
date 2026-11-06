// `npm run dev`: one terminal for local work.
// Re-renders the pages when src/ changes, recompiles the CSS when it changes,
// and serves site/ at http://localhost:4321 (PORT overrides it). Ctrl-C stops everything.
import { spawn } from "node:child_process";
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(APP, "site");
const PORT = Number(process.env.PORT) || 4321;

const children = [
  // Node reruns the build whenever a file in src/ changes.
  spawn(process.execPath, ["--watch-path=src", "src/build.mjs"], { cwd: APP, stdio: "inherit" }),
  spawn(join(APP, "node_modules", ".bin", "tailwindcss"), ["-i", "src/site.css", "-o", "site/assets/css/site.css", "--watch=always"], { cwd: APP, stdio: "inherit" }),
];
const stop = () => { for (const c of children) c.kill(); process.exit(); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const c of children) c.on("exit", (code) => { if (code) { console.error(`dev: a watcher exited with ${code}`); stop(); } });

// Static server, matching nginx.conf: /up for the health check, $uri then $uri/index.html.
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".woff2": "font/woff2", ".pdf": "application/pdf", ".ico": "image/x-icon",
};
const file = (p) => { try { return statSync(p).isFile() ? p : null; } catch { return null; } };

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/up") return res.end("ok\n");
  // get.* answers with the installer, like nginx.conf. Try: curl http://get.localhost:4321
  if (/^get\./.test(req.headers.host || "")) {
    const sh = path === "/" && file(join(SITE, "install.sh"));
    if (!sh) { res.writeHead(404, { "content-type": "text/plain" }); return res.end(path === "/" ? "site/install.sh is missing: the Docker build adds it, or copy ../boxx/install.sh there\n" : "404\n"); }
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache" });
    return createReadStream(sh).pipe(res);
  }
  const target = normalize(join(SITE, path));
  const found = target.startsWith(SITE) && (file(target) || file(join(target, "index.html")));
  if (!found) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    return file(join(SITE, "404.html")) ? createReadStream(join(SITE, "404.html")).pipe(res) : res.end("404\n");
  }
  // A directory without its trailing slash: redirect like nginx so relative links resolve.
  if (found !== target && !path.endsWith("/")) { res.writeHead(301, { location: path + "/" }); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(found)] || "application/octet-stream", "cache-control": "no-cache" });
  createReadStream(found).pipe(res);
}).listen(PORT, () => console.log(`dev: serving site/ at http://localhost:${PORT}`));
