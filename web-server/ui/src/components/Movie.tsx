import { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { NavLink, useParams } from "react-router-dom";

// MoviePlayer component
export const MoviePlayer: React.FC<{ id: string }> = ({ id }) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const [intervalId, setIntervalId] = useState<number>(0);
  const [hasFinishedWatching, setHasFinishedWatching] =
    useState<boolean>(false);

  useEffect(() => {
    //Implementing the setInterval method
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player === null) {
        return;
      }
      const currentTime = player.getCurrentTime();
      const totalTime = player.getDuration();
      if (currentTime / totalTime > 0.9) {
        setHasFinishedWatching(true);
      }
    }, 1000);

    setIntervalId(interval);

    //Clearing the interval
    return () => clearInterval(interval);
  }, [playerRef]);

  useEffect(() => {
    if (hasFinishedWatching) {
      clearInterval(intervalId);
      console.log("Set finished watching on this movie to true");
    }
  }, [hasFinishedWatching, intervalId]);

  useEffect(() => {
    fetch(import.meta.env.VITE_BASE_URL + ":80/movies/" + id).then((res) => {
      res
        .json()
        .then((data: Movie) => {
          setMovie(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }, []);

  if (!movie) return <div>Movie not found</div>;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{movie.title}!</h2>
      <ReactPlayer
        url={import.meta.env.VITE_BASE_URL + ":8081" + movie.filePath}
        ref={playerRef}
        controls
        playing
        width="100%"
      />
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
  hasWatched: boolean;
}

// Home component displaying movies
export const Movies: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    fetch(import.meta.env.VITE_BASE_URL + ":80/movies").then((res) => {
      res
        .json()
        .then((data: Movie[]) => {
          console.log(data);
          setMovies(data);
        })
        .catch((err) => {
          console.log(err);
          setMovies([]);
        });
    });
  }, []);

  return (
    <>
      <h1>Movies</h1>
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
            {movie.hasWatched && <p>(seen)</p>}
          </NavLink>
        ))}
      </div>
    </>
  );
};
