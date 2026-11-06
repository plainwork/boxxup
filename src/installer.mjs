// Writes site/install.sh for get.boxxup.com: boxx's installer at main's current
// commit, stamped with that commit so anyone reading it can find its source.
//
//   node src/installer.mjs [refs-file]   (npm run installer)
//
// The Dockerfile passes a refs file it ADDs, so its cache breaks whenever boxx changes.
// Without one, the refs are fetched here. Uses git's smart-HTTP ref list, not the
// GitHub API, so CI never hits API rate limits.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "plainwork/boxx";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "site", "install.sh");

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

const refs = process.argv[2]
  ? readFileSync(process.argv[2], "utf8")
  : await get(`https://github.com/${REPO}.git/info/refs?service=git-upload-pack`);
const sha = refs.match(/([0-9a-f]{40}) refs\/heads\/main\n/)?.[1];
if (!sha) throw new Error(`no refs/heads/main in the ${REPO} ref list`);

const script = await get(`https://raw.githubusercontent.com/${REPO}/${sha}/install.sh`);
const [shebang, ...rest] = script.split("\n");
if (!shebang.startsWith("#!")) throw new Error("install.sh doesn't start with a shebang");

const built = new Date().toISOString().slice(0, 10);
writeFileSync(OUT, [
  shebang,
  `# served by get.boxxup.com from ${REPO}@${sha.slice(0, 7)}, built ${built}`,
  `# https://github.com/${REPO}/blob/${sha}/install.sh`,
  ...rest,
].join("\n"));
console.log(`installer: site/install.sh from ${REPO}@${sha.slice(0, 7)}`);
