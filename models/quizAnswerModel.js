import pool from "../config/db.js";

export async function addQuizAnswer(user_id, number_of_pages, year_published, genre_preferences) {
    const [newQuizAnswer] = await pool.query(`
    INSERT INTO quiz_answers (user_id, number_of_pages, year_published, genre_preferences, created_at)
    VALUES (?, ?, ?, ?, NOW()) 
    ON DUPLICATE KEY UPDATE 
    number_of_pages = VALUES(number_of_pages),
    year_published = VALUES(year_published),
    genre_preferences = VALUES(genre_preferences),
    created_at = NOW()
    `, [user_id, number_of_pages, year_published, genre_preferences]);
    return newQuizAnswer.insertId;
}

export async function updateQuizAnswers(user_id, pages, year, genre) {
    if (Array.isArray(genre)) {
        genre = genre.join(', ');
    }

    const [updatedQuizAnswer] = await pool.query(
        `UPDATE quiz_answers 
         SET number_of_pages = ?, 
             year_published = ?, 
             genre_preferences = ?
         WHERE user_id = ?`,
        [pages, year, genre, user_id]
    );
    return updatedQuizAnswer;
}





export async function getQuizAnswerByUserId(id) {
    const [quizAnswerById] = await pool.query(`
        SELECT * 
        FROM quiz_answers
        WHERE user_id = ?
        `, [id]); //prepared statement
    return quizAnswerById[0];
}