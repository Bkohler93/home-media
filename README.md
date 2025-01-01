# home-media

`docker compose up` must be ran after setting environment variable MEDIA_HOST_PATH to the volume where the media is stored on the host device. Example:

```shell
export MEDIA_HOST_PATH=/mnt/c/media
docker compose up
```