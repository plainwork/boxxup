# Render the pages and stylesheet, then serve the static site with nginx.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY site ./site
RUN npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/site /usr/share/nginx/html
# get.boxxup.com serves boxx's installer, taken from boxx main at build time.
ADD --chmod=644 https://raw.githubusercontent.com/plainwork/boxx/main/install.sh /usr/share/nginx/html/install.sh
RUN head -n1 /usr/share/nginx/html/install.sh | grep -q '^#!' || { echo "install.sh doesn't look like a script" >&2; exit 1; }; touch /usr/share/nginx/html/install.sh
EXPOSE 80
