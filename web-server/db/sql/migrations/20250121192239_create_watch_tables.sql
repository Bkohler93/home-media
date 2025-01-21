-- +goose Up
-- +goose StatementBegin
CREATE TABLE has_watched_movie(
	movie_id INTEGER NOT NULL,
	user_id INTEGER NOT NULL
);

CREATE TABLE has_watched_tv(
	tv_id INTEGER NOT NULL,
	user_id INTEGER NOT NULL
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE has_watched_movie;
DROP TABLE has_watched_tv;
-- +goose StatementEnd
