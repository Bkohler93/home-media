package mediaservice

import (
	"context"
	"github.com/bkohler93/home-media/shared/rpc"
	db "github.com/bkohler93/home-media/web-server/db/go"
)

type MediaRPCService struct {
	q db.Querier
}

func New(q db.Querier) *MediaRPCService {
	return &MediaRPCService{q: q}
}

func (m *MediaRPCService) StoreTVShow(args *rpc.StoreTVArgs, reply *rpc.StoreTVReply) error {
	tvShow, err := m.q.CreateTVShow(context.Background(), db.CreateTVShowParams{
		Name:          args.TVData.Name,
		SeasonNumber:  int32(args.TVData.SeasonNumber),
		FilePath:      args.TVData.FilePath,
		EpisodeNumber: int32(args.TVData.EpisodeNumber),
		ReleaseYear:   int32(args.TVData.ReleaseYear),
	})
	if err != nil {
		return err
	}
	reply.Id = int(tvShow.ID)
	return nil
	//if _, err := db.Exec(`
	//	INSERT INTO tv_shows
	//	(name, season_number, file_path, episode_number, release_year)
	//	VALUES ($1,$2,$3,$4,$5)
	//`, args.TVData.Name, args.TVData.SeasonNumber, args.TVData.FilePath, args.TVData.EpisodeNumber, args.TVData.ReleaseYear); err != nil {
	//	log.Println(err)
	//	return err
	//}
	//return nil
}

func (m *MediaRPCService) StoreMovie(args *rpc.StoreMovieArgs, reply *rpc.StoreMovieReply) error {
	movie, err := m.q.CreateMovie(context.Background(), db.CreateMovieParams{
		Title:       args.MovieData.Name,
		ReleaseYear: int32(args.MovieData.ReleaseYear),
		FilePath:    args.MovieData.FilePath,
	})
	if err != nil {
		return err
	}
	reply.Id = int(movie.ID)
	return nil
	//if _, err := db.Exec(`
	//	INSERT INTO movies
	//	(title, release_year, file_path)
	//	VALUES ($1,$2,$3)
	//`, args.MovieData.Name, args.MovieData.ReleaseYear, args.MovieData.FilePath); err != nil {
	//	return err
	//}
}

func (m *MediaRPCService) RunRPCServer() {
	if err := rpc.ListenAndServe("1234", m); err != nil {
		panic(err)
	}
}
