# Stage 1: Build
FROM golang:alpine AS build

# set working directory
WORKDIR /app

# copy source code
COPY . .

# install dependencies
RUN go mod tidy

# build application
RUN go build -o /app/bin/app

# Stage 2: Create final image
FROM alpine:latest

# set working directory
WORKDIR /app

# Copy application binary
COPY --from=build /app/bin/app /app

# Copy media directory
# COPY --from=build /app/media /app/media

# Expose port
EXPOSE 8081

# Run media server
CMD ["/app/app"]