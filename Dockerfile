# Render the pages and stylesheet, then serve the static site with nginx.
FROM oven/bun:1.4-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY src ./src
COPY site ./site
RUN bun run build
# get.boxxup.com serves boxx's installer at main's current commit, stamped with it.
# ADDing the ref list re-checks it on every build, so a new boxx commit busts the cache.
ADD https://github.com/plainwork/boxx.git/info/refs?service=git-upload-pack /tmp/boxx-refs
RUN bun src/installer.mjs /tmp/boxx-refs

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/site /usr/share/nginx/html
EXPOSE 80
