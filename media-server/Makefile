build:
	go build -o ./bin/app .

run: build
	MEDIA_DIR=./media ./bin/app

docker-build:
	docker build -t media-server-tmp .

docker-run:
	docker run -p 8081:8081 media-server-tmp