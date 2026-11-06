# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

The boxx website, https://boxxup.com (repo `plainwork/boxxup`). It looks like the boxx TUI (`../boxx/tui`): the title bar, the key-bar hints, rounded panels and the blue palette from `tui/theme.go`. The home page opens with the TUI's deploy loader (the KITT braille scanner from `tui/loading.go`), which fades out as an 8-bit BOXX fades in and scales up behind it, then shows the install command.

## Commands

- `npm install`: install Tailwind 4 (the only dependency)
- `npm run build`: render the pages (`node src/build.mjs`), then compile `src/site.css` to `site/assets/css/site.css`
- `npm run dev`: one terminal for local work (`src/dev.mjs`). It re-renders the pages when `src/` changes, recompiles the CSS, and serves `site/` at http://localhost:4321 (`PORT` overrides it). Reload the browser to see changes; Ctrl-C stops everything.
- Docker: `docker build -t boxxup .` serves the site on port 80, and `GET /up` returns 200 for boxx.

There is no test suite or linter.

## CI and releases

Same model as markgarrigan/dotcom: a tag is the release, and nothing runs on branch pushes.

- To release: `npm version X.Y.Z --no-git-tag-version` (bumps `package.json` and `package-lock.json`), add an entry at the top of `CHANGELOG.md`, commit `chore: release X.Y.Z`, then `git tag vX.Y.Z && git push origin main vX.Y.Z`.
- `.github/workflows/publish.yml` runs on `v*` tags. It builds linux/amd64 and linux/arm64, pushes `ghcr.io/<owner>/<repo>` as `X.Y.Z`, `X.Y`, `X` and `latest`, then creates the GitHub Release with generated notes. The Dockerfile renders the pages, so a broken build fails before anything is pushed.
- Production runs in boxx as one app answering both hostnames:
  `boxx install ghcr.io/plainwork/boxxup:latest --host boxxup.com --host get.boxxup.com --redirect-host www.boxxup.com`
  With update policy `auto` it deploys each release. While boxxup is 0.x, `:0` also follows every release.
- The ghcr package must be public for boxx to pull it without registry credentials (GitHub › plainwork › Packages › boxxup › Package settings).

## Architecture

- `src/content.mjs` holds every word on the site: the pitch, install command, the intro's deploy steps, features and docs. Every claim must be checkable in the boxx repo (README, `cmd/`, `engine/`). `site.boxxVersion` is the boxx release shown in the title bar; bump it when boxx ships.
- `src/build.mjs` is a tiny static generator. It renders the shared shell (title bar, key-bar nav, status bar, theme modal) and writes `site/index.html`, `site/features/`, `site/docs/` and `site/404.html` (nginx's error page). Pages get a canonical URL from `site.url`. It also draws the 8-bit BOXX as an SVG from 7-row bitmaps (`GLYPHS`) and the favicon from the B. The generated HTML is build output, so edit the generator or the content, not the HTML.
- `src/site.css` holds Tailwind 4 plus seven themes as CSS variables on `:root[data-theme=…]`: boxx dark and light (the TUI's own colours, picked by the OS when no theme is set), mocha, phosphor, amber and borland. `--kitt-*` colour the scanner, `--logo-*` band the logo. The font is JetBrains Mono NL, self-hosted and subset (Latin, arrows, box drawing, blocks).
- `site/assets/js/main.js` is progressive enhancement only: the intro (scanner on a canvas, ported from `tui/loading.go`, because no subset font carries braille), the theme modal (live preview, persisted in localStorage as `boxx-theme`), the keys (f/d/g nav, t theme, c copy, h home, j/k scroll) and copy.
- boxx is a personal project, and the site says so: `site.note` is the muted line at the left of the status bar on every page, and `site.disclaimer` fills the "before you run it" modal. That modal opens whenever the install command is copied: the copy button, the `c` key, or any hand copy (mouse, ⌘C, context menu) of a selection containing `get.boxxup.com`, on any page. Keep the wording in step with the boxx README.
- The intro plays on a fresh visit or a reload, never when arriving from another page of the site, and never with reduced motion. Any key or click skips it. Without JS the page renders in its final state.

## The installer at get.boxxup.com

`curl https://get.boxxup.com | sh` installs boxx. `nginx.conf` has a second server block for `get.*` that answers `/` with `install.sh` as text/plain (no redirect, because `curl` without `-L` won't follow one). `src/installer.mjs` writes `site/install.sh`: it reads `plainwork/boxx` main's current commit from git's smart-HTTP ref list (not the GitHub API, so CI never hits rate limits), fetches `install.sh` at that commit, and stamps two comment lines after the shebang: the commit and build date, and a link to the file at that commit. The Dockerfile runs it after `ADD`ing the ref list, which re-checks the list on every build, so a new boxx commit busts the cache. A change to the installer reaches get.boxxup.com with the next site release. `npm run installer` does the same locally, and `npm run dev` then routes `get.localhost` like nginx does (`site/install.sh` is gitignored).

In boxx, the app needs `get.boxxup.com` as one of its hostnames.

## Open items

- The intro's `docker pull ghcr.io/plainwork/boxxup:latest` step matches the image `publish.yml` pushes from this repo; keep them in step if the repo moves.
- Docs are a single page of the README's quick reference; each section becomes its own page later.
