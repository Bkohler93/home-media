# home-media

Ensure to create `.env` using `.env.example` with the variables set before running `docker compose up`

For now videos uploaded to media server must be mp4 with h264 video and aac audio (stereo). Use command below to convert mkv into mp4:
```
ffmpeg -i input.mkv -c:v copy -c:a aac -b:a 192k -ac 2 output.mp4
```