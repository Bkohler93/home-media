package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/tus/tusd/v2/pkg/filelocker"
	"github.com/tus/tusd/v2/pkg/filestore"
	tusd "github.com/tus/tusd/v2/pkg/handler"
)

const port = "8081"

func main() {
	// tusd
	store := filestore.New("./uploads")
	locker := filelocker.New("./uploads")
	composer := tusd.NewStoreComposer()
	store.UseIn(composer)
	locker.UseIn(composer)
	handler, err := tusd.NewHandler(tusd.Config{
		BasePath:              "/files/",
		StoreComposer:         composer,
		NotifyCompleteUploads: true,
	})
	if err != nil {
		log.Fatalf("unable to create handler: %s", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.AllowAll().Handler)

	mediaDir := os.Getenv("MEDIA_DIR")
	if mediaDir == "" {
		log.Fatal("MEDIA_DIR variable not set")
	}
	fsys := os.DirFS(mediaDir)

	r.Get("/test", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("Hello from media server")) })
	r.Handle("/stream/*", http.StripPrefix("/stream/", http.FileServer(http.FS(fsys))))

	r.Handle("/files", http.StripPrefix("/files", handler))
	r.Handle("/files/*", http.StripPrefix("/files/", handler))

	go func() {
		for {
			event := <-handler.CompleteUploads
			uploadedFilePath := "./uploads/" + event.Upload.ID
			uploadedFileInfoPath := uploadedFilePath + ".info"
			newFilePath := mediaDir + "/movies/The_Penguin_S01E04_2024.mp4"

			uploadedF, err := os.Open(uploadedFilePath)
			if err != nil {
				log.Println("failed to open uploaded file", err)
				return
			}

			newF, err := os.Create(newFilePath)
			if err != nil {
				log.Println("failed to open new file to write to", err)
				return
			}

			_, err = io.Copy(newF, uploadedF)
			if err != nil {
				log.Println("failed to copy data...", err)
				return
			}

			log.Println("Created and transferred file")

			uploadedF.Close()
			newF.Close()
			os.Remove(uploadedFilePath)
			os.Remove(uploadedFileInfoPath)
		}
	}()

	fmt.Println("Listening on port", port)
	http.ListenAndServe(":"+port, r)
}
