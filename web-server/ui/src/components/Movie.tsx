import { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { NavLink, useParams } from "react-router-dom";

// MoviePlayer component
export const MoviePlayer: React.FC<{ id: string }> = ({ id }) => {
    const [movie, setMovie] = useState<Movie | null>(null);

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
export const MoviePlayerWrapper: React.FC = () => {
const { id } = useParams<{ id: string }>();
return id ? <MoviePlayer id={id} /> : <div>No movie selected</div>;
};

interface Movie {
    id: number;
    title: string;
    imgUrl: string;
    filePath: string;
    releaseYear: number;
  }
  
  // Home component displaying movies
export const Movies: React.FC = () => {
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