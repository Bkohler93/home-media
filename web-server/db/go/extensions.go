package db

import "github.com/bkohler93/home-media/web-server/models"

func (r *GetMoviesRow) ToMovie() models.Movie {
	return models.Movie{
		Id:          int(r.ID),
		Title:       r.Title,
		ReleaseYear: int(r.ReleaseYear),
		FilePath:    r.FilePath,
		ImgUrl:      r.ImgUrl.String,
		HasWatched:  r.HasWatched,
	}
}

func (m *Movie) ToMovie() models.Movie {
	return models.Movie{
		Id:          int(m.ID),
		Title:       m.Title,
		ReleaseYear: int(m.ReleaseYear),
		FilePath:    m.FilePath,
		ImgUrl:      m.ImgUrl.String,
		HasWatched:  false,
	}
}

func (r *GetTVShowsRow) ToTVShow() models.TVShow {
	return models.TVShow{
		Id:            int(r.ID),
		Name:          r.Name,
		SeasonNumber:  int(r.SeasonNumber),
		EpisodeNumber: int(r.EpisodeNumber),
		FilePath:      r.FilePath,
		ReleaseYear:   int(r.ReleaseYear),
		ImgUrl:        r.ImgUrl.String,
		HasWatched:    r.HasWatched,
	}
}
