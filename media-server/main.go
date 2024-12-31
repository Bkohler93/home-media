package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

const port = "8081"

func main() {
	r := chi.NewRouter()
	r.Use(middleware.Logger)

	fsys := os.DirFS("./media")

	r.Get("/test", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("Hello from media server")) })
	r.Handle("/stream/*", http.StripPrefix("/stream/", http.FileServer(http.FS(fsys))))

	fmt.Println("Listening on port", port)
	http.ListenAndServe(":"+port, r)
}
