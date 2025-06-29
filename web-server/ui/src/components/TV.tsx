import {
  createContext,
  ReactNode,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import ReactPlayer from "react-player";
import { useNavigate } from "react-router-dom";

interface TVResponse {
  id: number;
  name: string;
  seasonNumber: number;
  episodeNumber: number;
  filePath: string;
  releaseYear: number;
  imgUrl: string;
  hasWatched: boolean;
}

interface TVShow {
  name: string;
  imgUrl: string;
  seasons: Season[];
}

interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

interface Episode {
  episodeNumber: number;
  filePath: string;
  id: number;
  hasWatched: boolean;
}

export const TVPlayer: React.FC = () => {
  const { selectedShow, selectedSeason, selectedEpisode } = useTVShows();
  const playerRef = useRef<ReactPlayer>(null);
  const [intervalId, setIntervalId] = useState<number>(0);
  const [hasFinishedWatching, setHasFinishedWatching] =
    useState<boolean>(false);

  useEffect(() => {
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
      fetch(
        `${import.meta.env.VITE_BASE_URL}:80/tv_shows/${
          selectedEpisode!.id
        }/watch`,
        {
          method: "POST",
        }
      ).then((res) => {
        if (res.status != 200) {
          console.log("error making request - status code " + res.status);
        }
        console.log("Set finished watching on this movie to true");
      });
    }
  }, [hasFinishedWatching, intervalId, selectedEpisode]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        {selectedShow?.name}: Season {selectedSeason?.seasonNumber} Episode{" "}
        {selectedEpisode?.episodeNumber}
      </h2>
      <ReactPlayer
        ref={playerRef}
        url={
          import.meta.env.VITE_BASE_URL + ":8081" + selectedEpisode?.filePath
        }
        controls
        playing
        width="100%"
      />
    </div>
  );
};

export const Episodes: React.FC = () => {
  const { selectedShow, selectedSeason } = useTVShows();
  selectedSeason?.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

  return (
    <div>
      <h1 className="test-2xl font-bold mb-4">
        {selectedShow?.name}: Season {selectedSeason?.seasonNumber}
      </h1>
      <ul>
        {selectedSeason?.episodes.map((episode) => (
          <EpisodeListItem {...episode} />
        ))}
      </ul>
    </div>
  );
};

const EpisodeListItem: React.FC<Episode> = (episode) => {
  const navigate = useNavigate();
  const { setSelectedEpisode, selectedShow, selectedSeason } = useTVShows();
  const [hasWatched, setHasWatched] = useState<boolean>(episode.hasWatched);

  const handleSelectEpisode = () => {
    setSelectedEpisode(episode);
    navigate(
      `/tv-shows/${selectedShow?.name.replace(" ", "_")}/seasons/${
        selectedSeason?.seasonNumber
      }/episodes/${episode.episodeNumber}`
    );
  };

  const handleDeleteEpisode = () => {
    fetch(`${import.meta.env.VITE_BASE_URL}:80/tv_shows/${episode.id}`, {
      method: "DELETE",
    }).then((res) => {
      if (res.status != 200) {
        console.log("error making request - status code " + res.status);
      }
      navigate(`/tv-shows`);
    });
  };

  const handleWatchUnwatchEpisode = () => {
    const action = episode.hasWatched ? "unwatch" : "watch";
    const method = episode.hasWatched ? "DELETE" : "POST";

    fetch(
      `${import.meta.env.VITE_BASE_URL}:80/tv_shows/${episode.id}/${action}`,
      {
        method: method,
      }
    ).then((res) => {
      if (res.status != 200) {
        console.log("error making request - status code " + res.status);
      }
      setHasWatched(!hasWatched);
    });
  };

  return (
    <li>
      <div className="flex flex-row gap-3 justify-center">
        <p className="cursor-pointer" onClick={handleWatchUnwatchEpisode}>
          {hasWatched ? "✓" : "o"}
        </p>
        <p className="cursor-pointer" onClick={handleSelectEpisode}>
          Episode {episode.episodeNumber}
        </p>
        <p className="cursor-pointer" onClick={handleDeleteEpisode}>
          X
        </p>
      </div>
    </li>
  );
};

export const Seasons: React.FC = () => {
  const { selectedShow, setSelectedSeason } = useTVShows();
  const navigate = useNavigate();

  const handleSelectSeason = (season: Season) => {
    setSelectedSeason(season);
    navigate(
      `/tv-shows/${selectedShow?.name.replace(" ", "_")}/seasons/${
        season.seasonNumber
      }/episodes`
    );
  };

  selectedShow?.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);

  return (
    <div>
      <h1 className="test-2xl font-bold mb-4">{selectedShow?.name}</h1>
      <ul>
        {selectedShow?.seasons.map((season) => (
          <li
            className="cursor-pointer"
            onClick={() => handleSelectSeason(season)}
          >
            Season {season.seasonNumber}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const TVShows: React.FC = () => {
  const { tvShows, setTVShows, setSelectedShow } = useTVShows();
  const navigate = useNavigate();

  useEffect(() => {
    if (tvShows.length === 0) {
      // Fetch TV shows from the server
      fetch(import.meta.env.VITE_BASE_URL + ":80/tv_shows")
        .then((response) =>
          response.json().catch((err) => {
            console.log(err);
            setTVShows([]);
            return;
          })
        )
        .catch((err) => console.log("error fetching tv shows " + err))
        .then((res: TVResponse[]) => {
          if (res == undefined || res.length == 0) {
            setTVShows([]);
            return;
          }
          const tvShows: TVShow[] = [];
          res.forEach((tvRes) => {
            const tvShow = tvShows.find((tvShow) => tvShow.name == tvRes.name);
            if (tvShow == undefined) {
              tvShows.push({
                name: tvRes.name,
                imgUrl: tvRes.imgUrl,
                seasons: [
                  {
                    seasonNumber: tvRes.seasonNumber,
                    episodes: [
                      {
                        episodeNumber: tvRes.episodeNumber,
                        filePath: tvRes.filePath,
                        id: tvRes.id,
                        hasWatched: tvRes.hasWatched,
                      },
                    ],
                  },
                ],
              });
            } else {
              const season = tvShow.seasons.find(
                (season) => season.seasonNumber == tvRes.seasonNumber
              );
              if (season == undefined) {
                tvShow.seasons.push({
                  seasonNumber: tvRes.seasonNumber,
                  episodes: [
                    {
                      episodeNumber: tvRes.episodeNumber,
                      filePath: tvRes.filePath,
                      id: tvRes.id,
                      hasWatched: tvRes.hasWatched,
                    },
                  ],
                });
              } else {
                season.episodes.push({
                  episodeNumber: tvRes.episodeNumber,
                  filePath: tvRes.filePath,
                  id: tvRes.id,
                  hasWatched: tvRes.hasWatched,
                });
              }
            }
          });
          setTVShows(tvShows);
        });
    }
  }, []);

  const handleShowClick = (show: TVShow) => {
    setSelectedShow(show);
    navigate(`/tv-shows/${show.name.replace(" ", "_")}/seasons`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">TV Shows</h2>
      <ul>
        {tvShows.map((show) => (
          <li
            key={show.name.replace(" ", "_")}
            onClick={() => handleShowClick(show)}
            className="cursor-pointer"
          >
            {show.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

interface TVShowsContextProps {
  tvShows: TVShow[];
  selectedShow: TVShow | null;
  selectedSeason: Season | null;
  selectedEpisode: Episode | null;
  setTVShows: (shows: TVShow[]) => void;
  setSelectedShow: (show: TVShow | null) => void;
  setSelectedSeason: (season: Season | null) => void;
  setSelectedEpisode: (episode: Episode | null) => void;
}

const TVShowsContext = createContext<TVShowsContextProps | undefined>(
  undefined
);

export const TVShowsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [selectedShow, setSelectedShow] = useState<TVShow | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  return (
    <TVShowsContext.Provider
      value={{
        tvShows,
        selectedShow,
        selectedSeason,
        selectedEpisode,
        setTVShows,
        setSelectedShow,
        setSelectedSeason,
        setSelectedEpisode,
      }}
    >
      {children}
    </TVShowsContext.Provider>
  );
};

const useTVShows = () => {
  const context = useContext(TVShowsContext);
  if (!context) {
    throw new Error("useTVShows must be used within a TVShowsProvider");
  }
  return context;
};
