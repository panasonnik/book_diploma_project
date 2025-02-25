import pool from "../config/db.js";

export async function addBookScore(user_id, book_id, score) {
    const [newBookScore] = await pool.query(`
    INSERT INTO users_books (user_id, book_id, score)
    VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE score = VALUES(score)
    `, [user_id, book_id, score]);
    return newBookScore.insertId;
}