package main

import (
	"fmt"
	"net/http"

	"github.com/bkohler93/home-media/web-server/ui"
	"github.com/go-chi/chi/v5"
)

const port = "8080"

func main() {
	r := chi.NewRouter()

	//register ui handlers after other endpoints
	ui.RegisterHandlers(r)

	fmt.Println("Listening port", port)
	http.ListenAndServe(":"+port, r)
}
