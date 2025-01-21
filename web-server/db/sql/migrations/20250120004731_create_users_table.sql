-- +goose Up
-- +goose StatementBegin
CREATE TABLE users(
    id SERIAL NOT NULL,
    user_name TEXT NOT NULL,
    pw_hash TEXT NOT NULL
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE users;
-- +goose StatementEnd