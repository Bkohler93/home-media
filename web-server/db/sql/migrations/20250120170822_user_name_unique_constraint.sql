-- +goose Up
-- +goose StatementBegin
ALTER TABLE users
    ADD CONSTRAINT unique_user_name_constraint
    UNIQUE (user_name);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    users
DROP CONSTRAINT unique_user_name_constraint;
-- +goose StatementEnd
