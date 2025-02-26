import pool from "../config/db.js";

export async function addBookScore(user_id, book_id, score) {
    const [newBookScore] = await pool.query(`
    INSERT INTO user_book_scores (user_id, book_id, book_score)
    VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE book_score = VALUES(book_score)
    `, [user_id, book_id, score]);
    return newBookScore.insertId;
}

export async function updateBookScore(user_id, book_id, score) {
    const [updatedBookScore] = await pool.query(`
        UPDATE user_book_scores
        SET book_score = ?
        WHERE user_id = ? AND book_id = ?
    `, [score, user_id, book_id]);

    return updatedBookScore;
}

export async function bookScoreExists(user_id, book_id) {
    const [rows] = await pool.query(`
        SELECT * FROM user_book_scores
        WHERE user_id = ? AND book_id = ?
    `, [user_id, book_id]);
    
    return rows.length > 0;
}


export async function getUserBookScores(userId) {
    const [bookScores] = await pool.query(`
        SELECT * 
        FROM user_book_scores
        WHERE user_id = ?
        `, [userId]);
    return bookScores;//[0]?
}

export async function getBookScore(userId, bookId) {
    const [bookScore] = await pool.query(`
        SELECT * 
        FROM user_book_scores
        WHERE user_id = ? AND book_id = ?
        `, [userId, bookId]);
    return bookScore[0];
}