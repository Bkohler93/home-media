package ui

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"

	"github.com/go-chi/chi/v5"
)

//go:embed dist/*
var dist embed.FS

func RegisterHandlers(r chi.Router) error {
	fsys, err := fs.Sub(dist, "dist")
	if err != nil {
		return fmt.Errorf("error creating file system - %v", err)
	}
	fileServer := http.FileServer(http.FS(fsys))

	r.Handle("/*", fileServer)
	return nil
}
