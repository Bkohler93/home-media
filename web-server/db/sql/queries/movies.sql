-- -- name: GetMovies :many
-- SELECT * FROM movies;

-- name: GetMovie :one
SELECT * FROM movies WHERE id=$1;

-- name: GetMovies :many
SELECT 
	m.id, 
    m.release_year,
    m.img_url,
    m.file_path,
	m.title, 
	CAST(hwm.user_id IS NOT NULL AS BOOLEAN) AS has_watched 
FROM 
	movies m 
LEFT JOIN 
	has_watched_movie hwm 
ON 
	m.id = hwm.movie_id AND hwm.user_id = (
	SELECT id FROM users WHERE user_name = $1);

-- name: CreateMovie :one
INSERT INTO movies
(title, release_year, file_path)
VALUES ($1,$2,$3)
RETURNING *;