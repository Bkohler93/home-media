package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/bkohler93/home-media/web-server/ui"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	_ "github.com/lib/pq"
)

const port = "8080"

var db *sql.DB

func main() {
	var err error
	db, err = sql.Open("postgres", "user=user password=password host=db port=5432 dbname=media sslmode=disable")
	if err != nil {
		panic(err)
	}
	defer db.Close()
	r := chi.NewRouter()
	r.Use(cors.AllowAll().Handler)

	r.Get("/movies", getMovies)
	r.Get("/movies/{id}", getMovie)
	r.Get("/tv_shows", getTVShows)

	//register ui handlers after other endpoints
	ui.RegisterHandlers(r)

	fmt.Println("Listening port", port)
	http.ListenAndServe(":"+port, r)
}

func getMovie(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
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

	w.Header().Add("Content-Type", "application/json")
	data, err := json.Marshal(movies)
	if err != nil {
		panic(err)
	}
	w.Write(data)
}
