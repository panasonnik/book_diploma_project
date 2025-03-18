import pool from "../config/db.js";

export async function getUserGenresScore (userId) {
    const [rows] = await pool.query(`
SELECT uw.*, 
       GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en,
       GROUP_CONCAT(g.genre_name_uk ORDER BY g.genre_name_uk SEPARATOR ', ') AS genre_name_uk
FROM user_genres_weights uw
JOIN books_genres bg ON uw.genre_id = bg.genre_id
JOIN genres g ON bg.genre_id = g.genre_id
WHERE uw.user_id = ?
GROUP BY uw.user_id;
        `, [userId]);
    return rows;
}

export async function addUserGenresScore (userId, genreId, weight, count) {
    const [newRow] = await pool.query(`
        INSERT INTO user_genres_weights (user_id, genre_id, weight, books_read_count)
        VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE
    weight = VALUES(weight),
    books_read_count = VALUES(books_read_count);
        `, [userId, genreId, weight, count]
    );
    return newRow;
}
