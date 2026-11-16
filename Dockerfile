# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
# Defaults must be defined so envsubst replaces them (empty = fall back).
ENV NOMP_API_BASE_URL="" \
    NOMP_POOL_NAME="" \
    NOMP_STRATUM_HOST=""
COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/nginx/security-headers.inc.template /etc/nginx/templates/security-headers.inc.template
COPY --chmod=755 deploy/nginx/15-nomp-config.sh /docker-entrypoint.d/15-nomp-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
