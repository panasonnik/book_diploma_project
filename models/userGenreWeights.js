import pool from "../config/db.js";
import { getGenres } from "./genreModel.js";

export async function getGenresWithWeightsByUserId(userId) {
    const rows = await pool.query(`
SELECT ugw.user_id,
       ugw.genre_id,
       ugw.weight,
       GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en,
       GROUP_CONCAT(g.genre_name_uk ORDER BY g.genre_name_uk SEPARATOR ', ') AS genre_name_uk
FROM user_genre_weights ugw
JOIN genres g ON ugw.genre_id = g.genre_id
WHERE ugw.user_id = ?
GROUP BY ugw.user_id, ugw.genre_id;
    `, [userId]);
    const books = rows[0];
    return books;
}

export async function saveGenreWeight(userId, genreId, weight) {
    const [newGenreWeight] = await pool.query(`
        INSERT INTO user_genre_weights (user_id, genre_id, weight)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE weight = VALUES(weight);

    `, [userId, genreId, weight]);
    return newGenreWeight;
}
