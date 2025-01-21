-- name: GetTVShows :many
SELECT 
	tv.id, 
    tv.release_year,
    tv.img_url,
    tv.season_number,
    tv.episode_number,
    tv.file_path,
	tv.name, 
	CAST(hwt.user_id IS NOT NULL AS BOOLEAN) AS has_watched 
FROM 
	tv_shows tv 
LEFT JOIN 
	has_watched_tv hwt 
ON 
	hwt.tv_id = tv.id AND hwt.user_id = (
	SELECT u.id FROM users u WHERE u.user_name = $1);

-- name: DeleteTVShow :one
DELETE FROM tv_shows WHERE id=$1 RETURNING file_path;

-- name: CreateTVShow :one
INSERT INTO tv_shows
(name, season_number, file_path, episode_number, release_year)
VALUES ($1,$2,$3,$4,$5)
RETURNING *;


-- name: DeleteTVShowWatch :exec
DELETE FROM 
    has_watched_tv
WHERE 
    tv_id = $1 
    AND
    user_id = (SELECT u.id FROM users u WHERE u.user_name = $2);

-- name: CreateTVShowWatch :exec
INSERT INTO 
    has_watched_tv
    (tv_id, user_id)
VALUES (
    $1,
    (SELECT u.id FROM users u WHERE u.user_name = $2)
);