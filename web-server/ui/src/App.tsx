import React, { useEffect } from "react";
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
import { AuthProvider } from "./providers/auth";
import { useAuth } from "./hooks/auth";
import { AuthComponent } from "./components/Auth";

const AppContent: React.FC = () => {
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const response = await fetch(import.meta.env.VITE_BASE_URL + ":80/auth", {
      method: "POST",
    });

    if (response.status !== 200) {
      console.log("not authorized yet");
      return;
    }
    login();
  };

  if (isAuthenticated) {
    return (
      <Layout>
        <Routes>
          <Route path="/movies" element={<Movies />} />
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
    );
  }

  return <AuthComponent />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
