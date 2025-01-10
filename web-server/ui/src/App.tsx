import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MoviePlayerWrapper, Movies } from "./components/Movie";
import {
  Episodes,
  Seasons,
  TVPlayer,
  TVShows,
  TVShowsProvider,
} from "./components/TV";
import { Upload } from "./components/Upload";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Movies />} />
          {/* <Route path="/tv-shows" element={<TVShows />} /> */}
          <Route
            path="/tv-shows/*"
            element={
              <TVShowsProvider>
                <Routes>
                  <Route path="/" element={<TVShows />} />
                  <Route path="/:id/seasons" element={<Seasons />} />
                  <Route
                    path="/:id/seasons/:seasonNumber/episodes"
                    element={<Episodes />}
                  />
                  <Route
                    path="/:id/seasons/:seasonNumber/episodes/:episodeNumber"
                    element={<TVPlayer />}
                  ></Route>
                </Routes>
              </TVShowsProvider>
            }
          />
          <Route path="/movie/:id" element={<MoviePlayerWrapper />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
