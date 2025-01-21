-- +goose Up
-- +goose StatementBegin
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    release_year INT NOT NULL,
    file_path TEXT NOT NULL,
    img_url TEXT DEFAULT ''
);

CREATE TABLE tv_shows (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    season_number INT NOT NULL,
    episode_number INT NOT NULL,
    file_path TEXT NOT NULL,
    release_year INT NOT NULL,
    img_url TEXT DEFAULT ''
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE movies;
DROP TABLE tv_shows;
-- +goose StatementEnd
