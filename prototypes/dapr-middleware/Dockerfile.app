FROM golang:1.21-alpine AS builder
WORKDIR /build
COPY app.go .
COPY go.mod .
RUN go mod download || true
RUN go build -o app app.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /build/app .
EXPOSE 8081
CMD ["./app"]
