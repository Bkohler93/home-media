# Stage 1: Build the Vite project using Yarn
FROM node:22 AS ui-build

# Set working directory
WORKDIR /ui

# copy dependency files
COPY ui/package.json ui/yarn.lock ./

# install dependencies
RUN yarn install

# copy ui files
COPY ui/ ./

# Pass the environment variable to the Vite build process
ARG BASE_URL
ARG VITE_BASE_URL 
ENV VITE_BASE_URL=${BASE_URL}

RUN echo "VITE_BASE_URL is: $VITE_BASE_URL"
RUN echo "BASE_URL is: ${BASE_URL}"

# build React app
RUN yarn build

# Stage 2: Build the Go application
FROM golang:alpine AS go-build

# Set working directory
WORKDIR /go/src/app

# copy source code
COPY . .

# copy React app from ui-build step
COPY --from=ui-build /ui/dist /go/src/app/ui/dist

# Install dependencies
RUN go mod tidy

# Build go app
RUN go build -o /go/bin/app

# Stage 3: Final image
FROM alpine:latest

# Install packages
RUN apk --no-cache add ca-certificates

# Set working directory
WORKDIR /app

# Copy Go binary from build stage
COPY --from=go-build /go/bin/app /app

# Expose port
EXPOSE 8080

# Run the web server
CMD ["/app/app"]