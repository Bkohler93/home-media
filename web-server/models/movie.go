package models

type Movie struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	ReleaseYear int    `json:"releaseYear"`
	FilePath    string `json:"filePath"`
	ImgUrl      string `json:"imgUrl"`
	HasWatched  bool   `json:"hasWatched"`
}
