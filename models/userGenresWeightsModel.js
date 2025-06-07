import pool from "../config/db.js";

export async function getUserGenresScore (userId) {
    const [rows] = await pool.query(`
    SELECT
    g.genre_id,
    g.genre_name_en,
    AVG(ub.read_progress) AS avg_read_progress,
    COUNT(*) AS books_read_count,
    ugw.weight AS weight
    FROM user_books ub
    JOIN books b ON ub.book_id = b.book_id
    JOIN books_genres bg ON b.book_id = bg.book_id
    JOIN genres g ON bg.genre_id = g.genre_id
    LEFT JOIN user_genres_weights ugw 
    ON g.genre_id = ugw.genre_id AND ub.user_id = ugw.user_id
    WHERE ub.user_id = ?
    GROUP BY g.genre_id, g.genre_name_en, ugw.weight, ugw.books_read_count;
        `, [userId]);
    return rows;
}

export async function getUserGenresWeights (userId) {
    const [rows] = await pool.query(`
    SELECT ug.user_id, ug.genre_id, g.genre_name_en, ug.weight, ug.books_read_count
FROM user_genres_weights ug
JOIN genres g ON ug.genre_id = g.genre_id
WHERE ug.user_id = ?;

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

export async function deleteGenreScore (userId, genreId) {
    await pool.query(`DELETE FROM user_genres_weights WHERE user_id = ? AND genre_id = ?`, [userId, genreId]);
}

// export async function updateUserGenreScore (userId, genreId, weight, count) {
//     const [newRow] = await pool.query(`
//         INSERT INTO user_genres_weights (user_id, genre_id, weight, books_read_count)
//         VALUES (?, ?, ?, ?) 
//         ON DUPLICATE KEY UPDATE
//         weight = VALUES(weight),
//         books_read_count = VALUES(books_read_count);
//     `, [userId, genreId, weight, count]);
    
//         return newRow;
//     }
