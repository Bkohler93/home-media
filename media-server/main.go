package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/bkohler93/home-media/media-server/rpc"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	_ "github.com/lib/pq"
	"github.com/tus/tusd/v2/pkg/filelocker"
	"github.com/tus/tusd/v2/pkg/filestore"
	tusd "github.com/tus/tusd/v2/pkg/handler"
)

const port = "8081"

var (
	db       *sql.DB
	mediaDir string
)

func main() {
	var err error
	db, err = sql.Open("postgres", "user=user password=password host=db port=5432 dbname=media sslmode=disable")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// tusd
	store := filestore.New("./uploads")
	locker := filelocker.New("./uploads")
	composer := tusd.NewStoreComposer()
	store.UseIn(composer)
	locker.UseIn(composer)

	moviesHandler, err := tusd.NewHandler(tusd.Config{
		StoreComposer:         composer,
		BasePath:              "/movies/",
		NotifyCompleteUploads: true,
	})
	if err != nil {
		log.Fatalf("unable to create handler: %s", err)
	}

	tvHandler, err := tusd.NewHandler(tusd.Config{
		BasePath:              "/tv/",
		StoreComposer:         composer,
		NotifyCompleteUploads: true,
	})
	if err != nil {
		log.Fatalf("unable to create handler: %s", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.AllowAll().Handler)

	mediaDir = os.Getenv("MEDIA_DIR")
	if mediaDir == "" {
		log.Fatal("MEDIA_DIR variable not set")
	}
	fsys := os.DirFS(mediaDir)

	r.Get("/test", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("Hello from media server")) })
	r.Handle("/stream/*", http.StripPrefix("/stream/", http.FileServer(http.FS(fsys))))

	r.Handle("/movies", http.StripPrefix("/movies", moviesHandler))
	r.Handle("/movies/*", http.StripPrefix("/movies/", moviesHandler))

	r.Handle("/tv", http.StripPrefix("/tv", tvHandler))
	r.Handle("/tv/*", http.StripPrefix("/tv/", tvHandler))

	r.Delete("/delete/tv", deleteTVShow)

	go func() {
		for {
			select {
			case event := <-moviesHandler.CompleteUploads:
				uploadedFilePath := "./uploads/" + event.Upload.ID
				uploadedFileInfoPath := uploadedFilePath + ".info"
				defer os.Remove(uploadedFilePath)
				defer os.Remove(uploadedFileInfoPath)

				uploadedF, err := os.Open(uploadedFilePath)
				if err != nil {
					log.Println("failed to open uploaded file", err)
					continue
				}
				defer uploadedF.Close()

				uploadedFileInfo, err := os.Open(uploadedFileInfoPath)
				if err != nil {
					log.Println("failed to open uploaded file info", err)
					continue
				}
				defer uploadedFileInfo.Close()
				movieData := getMovieData(uploadedFileInfo)
				underscoreName := strings.ReplaceAll(movieData.Name, " ", "_")

				newFilePath := mediaDir + "/movies/" + underscoreName + "_" + movieData.ReleaseYear + ".mp4"

				os.MkdirAll(mediaDir+"/movies", os.ModePerm)
				newF, err := os.Create(newFilePath)
				if err != nil {
					log.Println("failed to open new file to write to", err)
					continue
				}
				defer newF.Close()

				_, err = io.Copy(newF, uploadedF)
				if err != nil {
					log.Println("failed to copy data...", err)
					continue
				}

				urlPath := fmt.Sprintf("/stream/movies/%s_%s.mp4", underscoreName, movieData.ReleaseYear)

				ms := RPCMovieStorer{
					serverAddress: "web",
					port:          ":1234",
				}
				if err := ms.storeMovie(movieData, urlPath); err != nil {
					log.Printf("failed to store movie data - %v\n", err)
				}

				log.Println("Created and transferred file")

			case event := <-tvHandler.CompleteUploads:

				uploadedFilePath := "./uploads/" + event.Upload.ID
				uploadedFileInfoPath := uploadedFilePath + ".info"
				defer os.Remove(uploadedFilePath)
				defer os.Remove(uploadedFileInfoPath)

				uploadedF, err := os.Open(uploadedFilePath)
				if err != nil {
					log.Println("failed to open uploaded file", err)
					continue
				}
				defer uploadedF.Close()

				uploadedFileInfo, err := os.Open(uploadedFileInfoPath)
				if err != nil {
					log.Println("failed to open uploaded file info", err)
					continue
				}
				defer uploadedFileInfo.Close()

				tvData := getTVData(uploadedFileInfo)
				underscoreName := strings.ReplaceAll(tvData.Name, " ", "_")

				newFilePath := mediaDir + "/tv/" + underscoreName + "/" + underscoreName + "_S" + tvData.SeasonNumber + "_E" + tvData.EpisodeNumber + "_" + tvData.ReleaseYear + ".mp4"

				os.MkdirAll(mediaDir+"/tv/"+underscoreName, os.ModePerm)
				newF, err := os.Create(newFilePath)
				if err != nil {
					log.Println("failed to open new file to write to", err)
					continue
				}
				defer newF.Close()

				_, err = io.Copy(newF, uploadedF)
				if err != nil {
					log.Println("failed to copy data...", err)
					continue
				}

				fileUrl := fmt.Sprintf("/stream/tv/%s/%s_S%s_E%s_%s.mp4", underscoreName, underscoreName, tvData.SeasonNumber, tvData.EpisodeNumber, tvData.ReleaseYear)
				rpcTVStorer := RPCTVStorer{
					serverAddress: "web-server",
					port:          ":1234",
				}

				if err := rpcTVStorer.storeTV(tvData, fileUrl); err != nil {
					log.Printf("failed to store tv data - %v\n", err)
				}

				log.Println("Created and transferred file")

			}
		}
	}()

	fmt.Println("Listening on port", port)
	http.ListenAndServe(":"+port, r)
}

func deleteTVShow(w http.ResponseWriter, r *http.Request) {
	bytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("error reading body - %v", err), http.StatusInternalServerError)
		return
	}
	filePath := string(bytes)
	filePath = strings.TrimPrefix(filePath, "/stream")

	if err = os.Remove(mediaDir + filePath); err != nil {
		http.Error(w, fmt.Sprintf("error deleting file - %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

type MovieMetaData struct {
	Name        string `json:"name"`
	ReleaseYear string `json:"releaseYear"`
}

type TVMetaData struct {
	Name          string `json:"name"`
	ReleaseYear   string `json:"releaseYear"`
	EpisodeNumber string `json:"episodeNumber"`
	SeasonNumber  string `json:"seasonNumber"`
}

type MetaDataIntermediary struct {
	ID             string          `json:"ID"`
	Size           int64           `json:"Size"`
	SizeIsDeferred bool            `json:"SizeIsDeferred"`
	Offset         int             `json:"Offset"`
	MetaData       json.RawMessage `json:"MetaData"`
	IsPartial      bool            `json:"IsPartial"`
	IsFinal        bool            `json:"IsFinal"`
	PartialUploads any             `json:"PartialUploads"`
	Storage        struct {
		InfoPath string `json:"InfoPath"`
		Path     string `json:"Path"`
		Type     string `json:"Type"`
	} `json:"Storage"`
}

func getTVData(r io.Reader) TVMetaData {
	var mdi MetaDataIntermediary

	err := json.NewDecoder(r).Decode(&mdi)
	if err != nil {
		panic(err)
	}

	var tv TVMetaData
	err = json.Unmarshal(mdi.MetaData, &tv)
	if err != nil {
		panic(err)
	}

	return tv
}

func getMovieData(r io.Reader) MovieMetaData {
	var mdi MetaDataIntermediary

	err := json.NewDecoder(r).Decode(&mdi)
	if err != nil {
		panic(err)
	}

	var m MovieMetaData
	err = json.Unmarshal(mdi.MetaData, &m)
	if err != nil {
		panic(err)
	}

	return m
}

type TVStorer interface {
	storeTV(TVMetaData, string) error
}

type DBTVStorer struct {
	*sql.DB
}

type RPCTVStorer struct {
	serverAddress string
	port          string
}

func (s RPCTVStorer) storeTV(t TVMetaData, urlPath string) error {
	seasonNumber, _ := strconv.Atoi(t.SeasonNumber)
	episodeNumber, _ := strconv.Atoi(t.EpisodeNumber)
	releaseYear, _ := strconv.Atoi(t.ReleaseYear)

	client, err := rpc.NewClient(s.serverAddress, s.port)
	if err != nil {
		return err
	}

	args := rpc.StoreTVArgs{
		TVData: rpc.TVData{
			Name:          t.Name,
			SeasonNumber:  seasonNumber,
			EpisodeNumber: episodeNumber,
			ReleaseYear:   releaseYear,
			FilePath:      urlPath,
		},
	}
	reply := &rpc.StoreTVReply{}
	return client.Call("MediaDBService.StoreTVShow", args, reply)
}

func (db DBTVStorer) storeTV(t TVMetaData, urlPath string) error {
	seasonNumber, _ := strconv.Atoi(t.SeasonNumber)
	episodeNumber, _ := strconv.Atoi(t.EpisodeNumber)
	releaseYear, _ := strconv.Atoi(t.ReleaseYear)

	if _, err := db.Exec(`
		INSERT INTO tv_shows 
		(name, season_number, file_path, episode_number, release_year)
		VALUES ($1,$2,$3,$4,$5)
	`, t.Name, seasonNumber, urlPath, episodeNumber, releaseYear); err != nil {
		return err
	}
	return nil
}

type MovieStorer interface {
	storeMovie(MovieMetaData, string) error
}

type DBMovieStorer struct {
	*sql.DB
}

type RPCMovieStorer struct {
	serverAddress string
	port          string
}

func (s *RPCMovieStorer) storeMovie(m MovieMetaData, urlPath string) error {
	releaseYear, _ := strconv.Atoi(m.ReleaseYear)

	client, err := rpc.NewClient(s.serverAddress, s.port)
	if err != nil {
		return err
	}

	args := rpc.StoreMovieArgs{
		MovieData: rpc.MovieData{
			Name:        m.Name,
			ReleaseYear: releaseYear,
			FilePath:    urlPath,
		},
	}
	reply := &rpc.StoreMovieReply{}
	return client.Call("MediaDBService.StoreMovie", args, reply)
}

func (s *DBMovieStorer) storeMovie(m MovieMetaData, urlPath string) error {
	releaseYear, _ := strconv.Atoi(m.ReleaseYear)

	if _, err := s.Exec(`
		INSERT INTO movies
		(title, release_year, file_path)	
		VALUES ($1,$2,$3)
	`, m.Name, releaseYear, urlPath); err != nil {
		return err
	}
	return nil
}
