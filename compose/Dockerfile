# syntax=docker/dockerfile:1
FROM node:24.21.0-trixie-slim@sha256:db3ae80f5d8df06e04dabdf7b44cbf008d32de168205fa0294444aabbc08c590 AS builder

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NODE_OPTIONS=--max_old_space_size=8192

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

WORKDIR /build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build --no-deps

FROM node:24.21.0-trixie-slim@sha256:db3ae80f5d8df06e04dabdf7b44cbf008d32de168205fa0294444aabbc08c590

RUN apt-get update \
    && apt-get install -y --no-install-recommends fontconfig curl \
    && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/node \
    USER=node \
    FONTCONFIG_PATH=/etc/fonts \
    NPM_CONFIG_PREFIX=/home/node/.npm-global \
    PORT=3000

COPY --chown=node --chmod=755 docker/images/parabol-ubi/entrypoints/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY --chown=node docker/images/parabol-ubi/tools/ip-to-server_id ${HOME}/tools/ip-to-server_id

RUN mkdir -p ${HOME}/parabol/self-hosted /usr/share/fonts \
    && chown node:node ${HOME}/parabol/self-hosted
COPY --chown=node static/fonts /usr/share/fonts

COPY --chown=node .env.example ${HOME}/parabol/.env.example
COPY --chown=node pnpm-lock.yaml ${HOME}/parabol/pnpm-lock.yaml
COPY --from=builder --chown=node /build/build ${HOME}/parabol/build
COPY --from=builder --chown=node /build/dist ${HOME}/parabol/dist

WORKDIR ${HOME}/parabol/
USER node
EXPOSE ${PORT}

ENTRYPOINT ["docker-entrypoint.sh"]
