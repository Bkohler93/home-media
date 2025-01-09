import React, { useEffect, useState } from 'react';
import './App.css'
import * as tus from 'tus-js-client';
import { BrowserRouter, NavLink, Route, Routes, useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';

const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <div className='flex h-screen'>

    {/* navigation menu */}
    <div className="w-48 bg-gray-800 text-white p-4">
      <h3 className="text-lg font-bold mb-4">Categories</h3>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `block mb-2 px-2 py-1 rounded ${
            isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
          }`
        }
      >
        Movies
      </NavLink>
      <NavLink
        to="/tv-shows"
        className={({ isActive }) =>
          `block mb-2 px-2 py-1 rounded ${
            isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
          }`
        }
      >
        TV Shows
      </NavLink>
      <NavLink
      to="/upload"
      className={({ isActive }) =>
        `block mb-2 px-2 py-1 rounded ${
          isActive ? 'bg-blue-600 text-white':'hover:bg-gray-700'
        }`
      } 
      >
        Upload
      </NavLink>
    </div><div>

    </div>

    {/* main content */}
    <div className='flex-1 p-6'>{children}</div>
  </div>
);

interface Movie {
  id: number;
  title: string;
  imgUrl: string;
  filePath: string;
  releaseYear: number;
}

// Home component displaying movies
const Home: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  // const movies: Movie[] = [
  //   { id: 1, title: 'The Penguin S01 E04', thumbnail: '/path/to/thumbnail1.jpg', url: 'localhost:8081/stream/movies/Interstellar.mp4' },
  //   { id: 2, title: 'Movie 2', thumbnail: '/path/to/thumbnail2.jpg', url: '/path/to/movie2.mp4' },
  // ];
  useEffect(()=>{
    fetch(import.meta.env.VITE_BASE_URL + ":8080/movies")
      .then((res) => {
        res.json().then((data : Movie[]) => {
          console.log(data);
          setMovies(data);
        })
      })
  }, [])

  return (
    <div className="grid grid-cols-2 gap-4">
      {movies.map((movie) => (
        <NavLink
          to={`/movie/${movie.id}`}
          key={movie.id}
          className="block text-center"
        >
          <img
            src={movie.imgUrl}
            alt={movie.title}
            className="w-full h-48 object-cover rounded"
          />
          <p className="mt-2 text-sm text-gray-800">{movie.title}</p>
        </NavLink>
      ))}
    </div>
  );
};

// TVShows component
const TVShows: React.FC = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">TV Shows</h2>
    <p>TV Shows content goes here.</p>
  </div>
);

enum UploadState {
  Waiting,
  Uploading,
  Finished
}

const Upload: React.FC = () => {
  const [file, setFile] = React.useState<File | undefined>();
  const [isTvShow, setIsTvShow] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [releaseYear, setReleaseYear] = useState<string>("");
  const [seasonNumber, setSeasonNumber] = useState<string>("");
  const [episodeNumber, setEpisodeNumber] = useState<string>("");
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.Waiting);
  const [uploadPercentage, setUploadPercentage] = useState<string>("");
  const [basePath, setBasePath] = useState<string>("/movies");

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }

  const handleReleaseYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReleaseYear(event.target.value);
  }

  const handleSeasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeasonNumber(event.target.value);
  }

  const handleEpisodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEpisodeNumber(event.target.value);
  }

  const handleFileChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;

    if (!fileList) return;

    setFile(fileList[0])
  }

  const handleSubmit = () => {
    if (!file) return;

    const metadata : {[key:string]: string}= {
      "filename": file.name,
      "filetype": file.type,
      "name": name,
      "releaseYear": releaseYear,
    };

    if (isTvShow) {
      metadata["seasonNumber"] = seasonNumber;
      metadata["episodeNumber"] = episodeNumber;
    }


    const upload = new tus.Upload(file, {
      endpoint: import.meta.env.VITE_BASE_URL + ':8081' + basePath,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: metadata,
      onError: function (error) {
        console.log('Failed because: ' + error)
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
        setUploadPercentage(percentage);
      },
      onSuccess: function () {
        setUploadState(UploadState.Finished);
        setUploadPercentage("");
        if (upload.file instanceof File) {
          console.log('Download %s from %s', upload.file.name, upload.url)
        }
      },
    })
    
    // Check if there are any previous uploads to continue.
    upload.findPreviousUploads().then(function (previousUploads) {
      // Found previous uploads so we select the first one.
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0])
      }
      
      // Start the upload
      upload.start()
      setUploadState(UploadState.Uploading);
    })    
  }

  const handleIsTVShowChange = () => {
    if (isTvShow) {
      setBasePath("/movies")
    } else {
      setBasePath("/tv")
    }
    setEpisodeNumber("");
    setSeasonNumber("");
    setIsTvShow(!isTvShow);
  }

  const handleAnotherUpload = () => {
    setUploadState(UploadState.Waiting);
  }

  return (
  <div className='flex flex-col gap-3'>
      <h1>Upload {isTvShow ? "TV Show" : "Movie"}</h1>
      <div className='flex justify-center gap-3'>
        <label htmlFor='isTvShow'>Is TV Show</label>
        <input type="checkbox" name="isTvShow" onChange={handleIsTVShowChange}/>
      </div> 

      <div className='flex justify-center gap-3'>
        <label htmlFor='filePicker'>Select file</label>
        <input type="file" name='filePicker' multiple={false} onChange={handleFileChange}/>
      </div> 

      <div className='flex justify-center gap-3'>
        <label htmlFor='name'>Name</label>
        <input type="text" name='name' onChange={handleNameChange}/>
      </div> 

      {isTvShow &&
      <>
      <div className='flex justify-center gap-3'>
        <label htmlFor='season'>Season Number</label>
        <input type="text" name='season' onChange={handleSeasonChange}/> 
      </div> 

      <div className='flex justify-center gap-3'>
        <label htmlFor='episode'>Episode Number</label>
        <input type="text" name='episode' onChange={handleEpisodeChange}/>
      </div> 

      </>
      }

      <div className='gap-3 flex justify-center'>
        <label htmlFor='releaseYear'>Release Year</label>
        <input type="text" name='releaseYear' onChange={handleReleaseYearChange}/>
      </div> 

      {uploadState == UploadState.Uploading ?
        <h2>{uploadPercentage}%</h2>
      : uploadState == UploadState.Waiting ?
      <button onClick={handleSubmit}>Upload</button>
        : <button onClick={handleAnotherUpload}>Upload Another</button>
    }
  </div>
  );
}

// MoviePlayer component
const MoviePlayer: React.FC<{ id: string }> = ({ id }) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  // const movies: Record<string, Movie> = {
  //   '1': { id: 1, releaseYear: 2024, title: 'The Penguin S01 E04', imgUrl: '', filePath: import.meta.env.VITE_BASE_URL + ':8081/stream/movies/The_Penguin_S01E04_2024.mp4' },
  //   '2': { id: 2, releaseYear: 2024, title: 'Movie 2', imgUrl: '', filePath: '/path/to/movie2.mp4' },
  // };

  // const movie = movies[id];
  // console.log(movie.filePath);
  useEffect(() => {
    fetch(import.meta.env.VITE_BASE_URL + ":8080/movies/" + id)
      .then((res) => {
        res.json().then((data :Movie) => {
          setMovie(data);
        }).catch((err) => {
          console.log(err);
        })
      })
  });

  if (!movie) return <div>Movie not found</div>;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{movie.title}</h2>
      <ReactPlayer url={import.meta.env.VITE_BASE_URL + ":8081" + movie.filePath} controls playing width="100%" />
    </div>
  );
};

// Wrapper for MoviePlayer to extract params
const MoviePlayerWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return id ? <MoviePlayer id={id} /> : <div>No movie selected</div>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tv-shows" element={<TVShows />} />
          <Route path="/movie/:id" element={<MoviePlayerWrapper />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App
