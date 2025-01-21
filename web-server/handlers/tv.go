package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	db "github.com/bkohler93/home-media/web-server/db/go"
	"github.com/bkohler93/home-media/web-server/models"
	"github.com/go-chi/chi/v5"
)

func (h *Handler) WatchTVShow(w http.ResponseWriter, r *http.Request) {
	showId := chi.URLParam(r, "id")
	sId, _ := strconv.Atoi(showId)
	username := r.Context().Value("username").(string)

	err := h.q.CreateTVShowWatch(context.Background(), db.CreateTVShowWatchParams{
		TvID:     int32(sId),
		UserName: username,
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("error watching tv show - %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) UnwatchTVShow(w http.ResponseWriter, r *http.Request) {
	showId := chi.URLParam(r, "id")
	sId, _ := strconv.Atoi(showId)
	username := r.Context().Value("username").(string)

	err := h.q.DeleteTVShowWatch(context.Background(), db.DeleteTVShowWatchParams{
		TvID:     int32(sId),
		UserName: username,
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("error unwatching tv show - %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) GetTVShows(w http.ResponseWriter, r *http.Request) {
	username := r.Context().Value("username").(string)
	var tvShows []models.TVShow
	dbTvs, err := h.q.GetTVShows(context.Background(), username)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	for _, dbTv := range dbTvs {
		tvShows = append(tvShows, dbTv.ToTVShow())
	}

	if len(tvShows) == 0 {
		tvShows = make([]models.TVShow, 0)
	}

	w.Header().Add("Content-Type", "application/json")
	data, err := json.Marshal(tvShows)
	if err != nil {
		http.Error(w, fmt.Sprintf("server error - %v", err), http.StatusInternalServerError)
		return
	}
	w.Write(data)
}

func (h *Handler) DeleteTVShow(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	filePath, err := h.q.DeleteTVShow(context.Background(), int32(id))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

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
