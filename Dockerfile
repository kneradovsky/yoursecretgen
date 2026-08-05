# syntax=docker/dockerfile:1

# Stage 1: build the application and produce dist/
FROM node:20-slim AS builder

# Install Rust toolchain and wasm-pack required to build the wasm crate.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && . "$HOME/.cargo/env" \
    && rustup target add wasm32-unknown-unknown \
    && cargo install wasm-pack \
    && apt-get purge -y curl ca-certificates \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN . "$HOME/.cargo/env" && npm run build

# Stage 2: serve static files with nginx
FROM nginx:alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
