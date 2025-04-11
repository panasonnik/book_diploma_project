import pool from "../config/db.js";

export async function getUserGenresScore (userId) {
    const [rows] = await pool.query(`
        SELECT uw.*, g.genre_name_en
        FROM user_genres_weights uw
        JOIN books_genres bg ON uw.genre_id = bg.genre_id
        JOIN genres g ON bg.genre_id = g.genre_id
        WHERE uw.user_id = ?
        GROUP BY uw.user_id, uw.genre_id;
        `, [userId]);
    return rows;
}

export async function getUserGenreScoreByGenreName (userId, genre_name_en) {
    const [rows] = await pool.query(`
        SELECT uw.*, g.genre_name_en
        FROM user_genres_weights uw
        JOIN books_genres bg ON uw.genre_id = bg.genre_id
        JOIN genres g ON bg.genre_id = g.genre_id
        WHERE uw.user_id = ?
        WHERE g.genre_name_en = ?
        GROUP BY uw.user_id, uw.genre_id;
        `, [userId,genre_name_en]);
    return rows;
}

export async function clearUserGenresScore (userId) {
    await pool.query(`DELETE FROM user_genres_weights WHERE user_id = ?`, [userId]);
}

export async function addUserGenresScore (userId, genreId, weight, count) {
const [newRow] = await pool.query(`
    INSERT INTO user_genres_weights (user_id, genre_id, weight, books_read_count)
    VALUES (?, ?, ?, ?) 
    ON DUPLICATE KEY UPDATE
    weight = VALUES(weight),
    books_read_count = VALUES(books_read_count);
`, [userId, genreId, weight, count]);

    return newRow;
}

export async function updateUserGenreScore (userId, genreId, weight, count) {
    const [newRow] = await pool.query(`
        INSERT INTO user_genres_weights (user_id, genre_id, weight, books_read_count)
        VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE
        weight = VALUES(weight),
        books_read_count = VALUES(books_read_count);
    `, [userId, genreId, weight, count]);
    
        return newRow;
    }
