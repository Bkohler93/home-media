-- +goose Up
-- +goose StatementBegin
ALTER TABLE has_watched_tv 
ADD CONSTRAINT has_watched_tv_pk PRIMARY KEY (user_id, tv_id);

ALTER TABLE has_watched_movie
ADD CONSTRAINT has_watched_movie_pk PRIMARY KEY (user_id, movie_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE has_watched_tv DROP CONSTRAINT has_watch_tv_pk;
ALTER TABLE has_watched_movie DROP CONSTRAINT has_watched_movie_pk;
-- +goose StatementEnd
