FROM golang:1.21-alpine

WORKDIR /app

# Copy source files
COPY app.go middleware.go test.go runner.go ./
COPY go.mod .

# Download dependencies
RUN go mod download || true

# Build all binaries
RUN go build -o app app.go && \
    go build -o middleware middleware.go && \
    go build -o test test.go && \
    go build -o runner runner.go

EXPOSE 8080 8081

CMD ["./runner"]
