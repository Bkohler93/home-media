package main

import (
	"database/sql"
	"embed"
	"fmt"
	"github.com/bkohler93/home-media/web-server/db/go"
	"github.com/bkohler93/home-media/web-server/handlers"
	"github.com/bkohler93/home-media/web-server/mediaservice"
	"github.com/bkohler93/home-media/web-server/ui"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
	"log"
	"net/http"
)

//go:embed db/sql/migrations/*.sql
var embedMigrations embed.FS

const port = "80"

// var db *sql.DB
//var dbmu sync.Mutex

func main() {
	d, err := sql.Open("postgres", "user=user password=password host=db port=5432 dbname=media sslmode=disable")
	if err != nil {
		panic(err)
	}
	defer d.Close()

	goose.SetBaseFS(embedMigrations)

	if err := goose.SetDialect("postgres"); err != nil {
		panic(err)
	}

	if err := goose.Up(d, "db/sql/migrations"); err != nil {
		panic(err)
	}

	q := db.New(d)
	//h := handler{q}
	h := handlers.New(q)
	m := mediaservice.New(q)

	go m.RunRPCServer()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.AllowAll().Handler)

	h.RegisterApiRoutes(r)

	//register ui handlers after other endpoints
	err = ui.RegisterHandlers(r)
	if err != nil {
		log.Fatal("Failed to register UI handlers", err)
	}

	fmt.Println("Listening port", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
