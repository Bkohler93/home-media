build:
	go build -o ./bin/app .

run: build
	./bin/app

docker-build:
	docker build -t web-server-tmp .

docker-run:
	docker run -p 8080:8080 web-server-tmp