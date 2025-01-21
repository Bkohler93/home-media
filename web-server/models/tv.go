package models

type TVShow struct {
	Id            int    `json:"id"`
	Name          string `json:"name"`
	SeasonNumber  int    `json:"seasonNumber"`
	EpisodeNumber int    `json:"episodeNumber"`
	FilePath      string `json:"filePath"`
	ReleaseYear   int    `json:"releaseYear"`
	ImgUrl        string `json:"imgUrl"`
	HasWatched    bool   `json:"hasWatched"`
}
