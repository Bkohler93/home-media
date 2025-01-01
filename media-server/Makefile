build:
	go build -o ./bin/app .

run: build
	./bin/app

docker-build:
	docker build -t media-server-tmp .

docker-run:
	docker run -p 8081:8081 media-server-tmp