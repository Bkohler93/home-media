import React from 'react';
import './App.css'
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

// MoviePlayer component
const MoviePlayer: React.FC<{ id: string }> = ({ id }) => {
  const movies: Record<string, Movie> = {
    '1': { id: 1, title: 'Eternal Sunshine of the Spotless Mind', thumbnail: '', url: import.meta.env.VITE_BASE_URL + ':8081/stream/movies/Eternal_Sunshine_Of_The_Spotless_Mind.mp4' },
    '2': { id: 2, title: 'Movie 2', thumbnail: '', url: '/path/to/movie2.mp4' },
  };

  const movie = movies[id];

  if (!movie) return <div>Movie not found</div>;
  console.log(movie.url)
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App
