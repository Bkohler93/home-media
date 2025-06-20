# Stage 1: Build the Vite project using Yarn
FROM node:22 AS ui-build

WORKDIR /ui

# Copy only dependency files first
COPY web-server/ui/package.json web-server/ui/yarn.lock ./

# Install dependencies early (this gets cached if deps don't change)
RUN yarn install

# Now copy the rest of the frontend source files
COPY web-server/ui/ .

# Pass environment variables to Vite
ARG BASE_URL
ENV VITE_BASE_URL=${BASE_URL}

# Build the frontend
RUN yarn build

# Stage 2: Build the Go application
FROM golang:alpine AS go-build

WORKDIR /home-media

# Copy Go mod files first to cache `go mod tidy`
COPY go.mod go.sum ./

RUN go mod download

# Now copy the rest of the source
COPY ./web-server ./web-server
COPY ./shared ./shared

# Copy built frontend
COPY --from=ui-build /ui/dist web-server/ui/dist

# Build the Go binary
RUN cd web-server && go build -o /app

# Stage 3: Final Image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=go-build /app .

EXPOSE 80

CMD ["/app/app"]

