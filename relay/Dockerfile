# Stage 1: Build static Go binary
FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /hydralisk-relay .

# Stage 2: Minimal distroless runtime
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /hydralisk-relay /hydralisk-relay
USER nonroot:nonroot

EXPOSE 8080
ENTRYPOINT ["/hydralisk-relay"]
