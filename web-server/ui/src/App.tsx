import React from 'react';
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
  thumbnail: string;
  url: string;
}

// Home component displaying movies
const Home: React.FC = () => {
  const movies: Movie[] = [
    { id: 1, title: 'Interstellar', thumbnail: '/path/to/thumbnail1.jpg', url: 'localhost:8081/stream/movies/Interstellar.mp4' },
    { id: 2, title: 'Movie 2', thumbnail: '/path/to/thumbnail2.jpg', url: '/path/to/movie2.mp4' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {movies.map((movie) => (
        <NavLink
          to={`/movie/${movie.id}`}
          key={movie.id}
          className="block text-center"
        >
          <img
            src={movie.thumbnail}
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

const Upload: React.FC = () => {
  const [file, setFile] = React.useState<File | undefined>();

  const handleFileChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;

    if (!fileList) return;

    setFile(fileList[0])
  }

  const handleSubmit = (event : React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    var upload = new tus.Upload(file, {
      endpoint: import.meta.env.VITE_BASE_URL + ':8081/files/',
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type,
      },
      onError: function (error) {
        console.log('Failed because: ' + error)
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
        console.log(bytesUploaded, bytesTotal, percentage + '%')
      },
      onSuccess: function () {
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
  })    
  
  }

  return (
  <div>
    <form onSubmit={handleSubmit}>
      <h1>Upload Movie</h1>
      <input type="file" multiple={false} onChange={handleFileChange}/>

      <button type="submit">Upload</button>
    </form>
  </div>
  );
}

// MoviePlayer component
const MoviePlayer: React.FC<{ id: string }> = ({ id }) => {
  const movies: Record<string, Movie> = {
    '1': { id: 1, title: 'Interstellar', thumbnail: '', url: import.meta.env.VITE_BASE_URL + ':8081/stream/movies/Interstellar.mp4' },
    '2': { id: 2, title: 'Movie 2', thumbnail: '', url: '/path/to/movie2.mp4' },
  };

  const movie = movies[id];
  console.log(movie.url);

  if (!movie) return <div>Movie not found</div>;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{movie.title}</h2>
      <ReactPlayer url={movie.url} controls playing width="100%" />
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
