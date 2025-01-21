-- name: GetUser :one
SELECT * FROM users WHERE id=$1;

-- name: GetUserByName :one
SELECT * FROM users WHERE user_name=$1;

-- name: CreateUser :one
INSERT INTO users
(user_name, pw_hash)
VALUES ($1,$2)
RETURNING *;