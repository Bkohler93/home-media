package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/bkohler93/home-media/web-server/models"
	"github.com/go-chi/chi/v5"
)

func (h *Handler) GetMovies(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value("username").(string)
	var movies []models.Movie
	dbMovies, err := h.q.GetMovies(context.Background(), username)
	if err != nil {
		http.Error(w, fmt.Sprintf("server error - %v", err), http.StatusInternalServerError)
		return
	}
	for _, dbm := range dbMovies {
		movies = append(movies, dbm.ToMovie())
	}

	if len(movies) == 0 {
		movies = make([]models.Movie, 0)
	}

	w.Header().Add("Content-Type", "application/json")
	data, err := json.Marshal(movies)
	if err != nil {
		panic(err)
	}
	w.Write(data)
}

func (h *Handler) GetMovie(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	dbm, err := h.q.GetMovie(context.Background(), int32(id))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	m := dbm.ToMovie()

	bytes, err := json.Marshal(m)
	if err != nil {
		http.Error(w, fmt.Sprintf("error encoding movie into json - %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Add("Content-Type", "application/json")
	w.Write(bytes)
}
