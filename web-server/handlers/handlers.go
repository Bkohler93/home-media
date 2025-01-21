package handlers

import (
	db "github.com/bkohler93/home-media/web-server/db/go"
	"github.com/bkohler93/home-media/web-server/middleware"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	q db.Querier
}

func New(q db.Querier) *Handler {
	return &Handler{q: q}
}

func (h *Handler) RegisterApiRoutes(r *chi.Mux) {
	r.Post("/register", h.PostUser)
	r.Post("/login", h.UserLogin)

	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth)
		r.Get("/movies", h.GetMovies)
		r.Get("/movies/{id}", h.GetMovie)
		r.Get("/tv_shows", h.GetTVShows)
		r.Delete("/tv_shows/{id}", h.DeleteTVShow)
		r.Delete("/tv_shows/{id}/unwatch", h.UnwatchTVShow)
		r.Post("/tv_shows/{id}/watch", h.WatchTVShow)
		r.Post("/auth", h.CheckAuth)
	})
}
