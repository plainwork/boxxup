# boxxup

The website for [boxx](https://github.com/plainwork/boxx): https://boxxup.com.
It also serves the installer at `get.boxxup.com`:

```sh
curl https://get.boxxup.com | sh
```

> **boxx is a personal project.** It works, and I run my own production sites on it, but it's
> built for how I work, not as a supported product. It isn't meant for critical production apps.

## Develop

```sh
npm install
npm run dev   # http://localhost:4321
```

A static generator (`src/build.mjs`) renders the pages from `src/content.mjs`, and Tailwind compiles `src/site.css`.
The image is nginx serving `site/`, with `GET /up` for boxx's health check.

## Release

Push a `v*` tag. `.github/workflows/publish.yml` builds the image for amd64 and arm64,
pushes it to `ghcr.io/plainwork/boxxup` and creates the GitHub Release. See CLAUDE.md for the steps.
