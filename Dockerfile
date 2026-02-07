# ---- Frontend build ----
FROM node:24-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

# ---- Backend build ----
FROM rust:1.93-slim AS backend-build
WORKDIR /app/backend
ARG TARGETARCH
RUN apt-get update \
  && apt-get install -y --no-install-recommends musl-tools ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY backend/Cargo.toml backend/Cargo.lock ./
COPY backend/src ./src
RUN set -eux; \
    case "$TARGETARCH" in \
      amd64) RUST_TARGET="x86_64-unknown-linux-musl" ;; \
      arm64) RUST_TARGET="aarch64-unknown-linux-musl" ;; \
      *) echo "Unsupported arch: $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    rustup target add "$RUST_TARGET"; \
    cargo build --release --target "$RUST_TARGET"; \
    mkdir -p /app/backend/target/release; \
    cp "target/$RUST_TARGET/release/s3-streamer-backend" /app/backend/target/release/s3-streamer-backend

# ---- Runtime ----
FROM scratch
WORKDIR /app

COPY --from=backend-build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=backend-build /app/backend/target/x86_64-unknown-linux-musl/release/s3-streamer-backend /app/s3-streamer-backend
COPY --from=frontend-build /app/frontend/dist /app/static

ENV PORT=3000
ENV STATIC_DIR=/app/static
EXPOSE 3000

CMD ["/app/s3-streamer-backend"]
