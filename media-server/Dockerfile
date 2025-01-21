# Stage 1: Build
FROM golang:alpine AS build

# set working directory
WORKDIR /home-media

# copy go mod file
COPY go.mod .

# copy source code
COPY ./media-server ./media-server
COPY ./shared ./shared

# install dependencies
RUN go mod tidy

# build application
RUN cd media-server && go build -o /app

# Stage 2: Create final image
FROM alpine:latest

# set working directory
WORKDIR /app

# Copy application binary
COPY --from=build /app /app

# Copy media directory
# COPY --from=build /app/media /app/media

# Expose port
EXPOSE 8081

# Run media server
CMD ["/app/app"]