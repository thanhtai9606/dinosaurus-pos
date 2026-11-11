# --- Stage 1: Build Frontend (SPA) ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/web

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY web/package.json web/pnpm-lock.yaml web/.npmrc ./
RUN pnpm install --frozen-lockfile

COPY web/ ./
RUN pnpm run build

# --- Stage 2: Build Backend ---
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

COPY --from=frontend-builder /app/web/dist ./web/dist

RUN CGO_ENABLED=0 GOOS=linux go build -o pos-server ./cmd/app

# --- Stage 3: Final Image (minimal, no Node.js) ---
FROM alpine:3.21
WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=backend-builder /app/pos-server ./pos-server
COPY --from=frontend-builder /app/web/dist ./web/dist
COPY --from=backend-builder /app/docs ./docs

EXPOSE 8080

CMD ["./pos-server"]
