CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    release_year INT NOT NULL,
    thumbnail TEXT
);

CREATE TABLE tv_shows (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    season_number INT NOT NULL,
    episdoe_number INT NOT NULL
);