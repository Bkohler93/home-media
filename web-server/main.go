package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/bkohler93/home-media/web-server/rpc"
	"github.com/bkohler93/home-media/web-server/ui"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/lib/pq"
)

const port = "8080"

var db *sql.DB
var dbmu sync.Mutex

func main() {
	var err error
	db, err = sql.Open("postgres", "user=user password=password host=db port=5432 dbname=media sslmode=disable")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	go runRPCServer()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.AllowAll().Handler)

	r.Get("/movies", getMovies)
	r.Get("/movies/{id}", getMovie)
	r.Get("/tv_shows", getTVShows)
	r.Delete("/tv_shows/{id}", deleteTVShow)

	//register ui handlers after other endpoints
	ui.RegisterHandlers(r)

	fmt.Println("Listening port", port)
	http.ListenAndServe(":"+port, r)
}

func deleteTVShow(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	row := db.QueryRow(`DELETE FROM tv_shows WHERE id = $1 RETURNING file_path;`, id)
	var filePath string
	row.Scan(&filePath)

	req, err := http.NewRequest("DELETE", "http://media-server:8081/delete/tv", strings.NewReader(filePath))
	if err != nil {
		http.Error(w, fmt.Sprintf("error creating request to media server - %v", err), http.StatusInternalServerError)
		return
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("error contacting media server - %v", err), http.StatusInternalServerError)
		return
	}
	if res.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf("error with media server status code %d", res.StatusCode), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func getMovie(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	dbmu.Lock()
	defer dbmu.Unlock()
	rows, err := db.Query(`
	SELECT * FROM movies WHERE id = $1;	
	`, id)
	if err != nil {
		http.Error(w, fmt.Sprintf("error retrieving movie - %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var m Movie
	rows.Next()
	err = rows.Scan(&m.Id, &m.Title, &m.ReleaseYear, &m.FilePath, &m.ImgUrl)
	if err != nil {
		http.Error(w, fmt.Sprintf("error reading movie from db - %v", err), http.StatusInternalServerError)
		return
	}
	bytes, err := json.Marshal(m)
	if err != nil {
		http.Error(w, fmt.Sprintf("error encoding movie into json - %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Add("Content-Type", "application/json")
	w.Write(bytes)
}

type TVShow struct {
	Id            int    `json:"id"`
	Name          string `json:"name"`
	SeasonNumber  int    `json:"seasonNumber"`
	EpisodeNumber int    `json:"episodeNumber"`
	FilePath      string `json:"filePath"`
	ReleaseYear   int    `json:"releaseYear"`
	ImgUrl        string `json:"imgUrl"`
}

func getTVShows(w http.ResponseWriter, r *http.Request) {
	var tvShows []TVShow

	dbmu.Lock()
	defer dbmu.Unlock()
	rows, err := db.Query(`
	SELECT * FROM tv_shows;	
	`)
	if err != nil {
		http.Error(w, fmt.Sprintf("db error - %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var tvShow TVShow
		err = rows.Scan(&tvShow.Id, &tvShow.Name, &tvShow.SeasonNumber, &tvShow.EpisodeNumber, &tvShow.FilePath, &tvShow.ReleaseYear, &tvShow.ImgUrl)
		tvShows = append(tvShows, tvShow)
	}

	if len(tvShows) == 0 {
		tvShows = make([]TVShow, 0)
	}

	w.Header().Add("Content-Type", "application/json")
	data, err := json.Marshal(tvShows)
	if err != nil {
		http.Error(w, fmt.Sprintf("server error - %v", err), http.StatusInternalServerError)
		return
	}
	w.Write(data)
}

type Movie struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	ReleaseYear int    `json:"releaseYear"`
	FilePath    string `json:"filePath"`
	ImgUrl      string `json:"imgUrl"`
}

func getMovies(w http.ResponseWriter, r *http.Request) {
	var movies []Movie

	dbmu.Lock()
	defer dbmu.Unlock()
	rows, err := db.Query(`
	SELECT * FROM movies	
	`)
	if err != nil {
		http.Error(w, fmt.Sprintf("error executing db command - %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var m Movie
		err = rows.Scan(&m.Id, &m.Title, &m.ReleaseYear, &m.FilePath, &m.ImgUrl)
		if err != nil {
			panic(err)
		}
		movies = append(movies, m)
	}

	if len(movies) == 0 {
		movies = make([]Movie, 0)
	}

	w.Header().Add("Content-Type", "application/json")
	data, err := json.Marshal(movies)
	if err != nil {
		panic(err)
	}
	w.Write(data)
}

type MediaDBService struct{}

func (m *MediaDBService) StoreTVShow(args *rpc.StoreTVArgs, reply *rpc.StoreTVReply) error {
	if _, err := db.Exec(`
		INSERT INTO tv_shows 
		(name, season_number, file_path, episode_number, release_year)
		VALUES ($1,$2,$3,$4,$5)
	`, args.TVData.Name, args.TVData.SeasonNumber, args.TVData.FilePath, args.TVData.EpisodeNumber, args.TVData.ReleaseYear); err != nil {
		log.Println(err)
		return err
	}
	return nil
}

func (m *MediaDBService) StoreMovie(args *rpc.StoreMovieArgs, reply *rpc.StoreMovieReply) error {
	if _, err := db.Exec(`
		INSERT INTO movies
		(title, release_year, file_path)	
		VALUES ($1,$2,$3)
	`, args.MovieData.Name, args.MovieData.ReleaseYear, args.MovieData.FilePath); err != nil {
		return err
	}
	return nil
}

func runRPCServer() {
	s := new(MediaDBService)
	if err := rpc.ListenAndServe(":1234", s); err != nil {
		panic(err)
	}
}
