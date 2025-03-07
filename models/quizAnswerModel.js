import pool from "../config/db.js";

export async function addQuizAnswer(user_id, weights_number_of_pages, weights_year_published, weights_genre, weights_language, genre_preferences, language_preferences, likes_old_books, likes_short_books) {
    const [newQuizAnswer] = await pool.query(`
    INSERT INTO quiz_answers (user_id, weights_number_of_pages, weights_year_published, weights_genre, weights_language, genre_preferences, language_preferences, likes_old_books, likes_short_books, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) 
    ON DUPLICATE KEY UPDATE 
    weights_number_of_pages = VALUES(weights_number_of_pages),
    weights_year_published = VALUES(weights_year_published),
    weights_genre = VALUES(weights_genre),
    weights_language = VALUES(weights_language),
    genre_preferences = VALUES(genre_preferences),
    language_preferences = VALUES(language_preferences),
    likes_old_books = VALUES(likes_old_books),
    likes_short_books = VALUES (likes_short_books),
    created_at = NOW()
    `, [user_id, weights_number_of_pages, weights_year_published, weights_genre, weights_language, genre_preferences, language_preferences, likes_old_books, likes_short_books]);
    return newQuizAnswer.insertId;
}

export async function updateQuizAnswerPreferences(user_id, weights_genre, weights_language, likes_old_books, likes_short_books, genres, languages) {
    if (Array.isArray(genres)) {
        genres = genres.join(', ');
    }
    if (Array.isArray(languages)) {
        languages = languages.join(', ');
    }
    const [updatedQuizAnswer] = await pool.query(`
        UPDATE quiz_answers 
        SET weights_genre = ?, weights_language = ?, likes_old_books = ?, likes_short_books = ?, genre_preferences = ?, language_preferences = ?
        WHERE user_id = ?
        `, [weights_genre, weights_language, likes_old_books, likes_short_books, genres, languages, user_id]
    );
    return updatedQuizAnswer;
}

export async function updateQuizAnswerLanguages(user_id, languages) {
    if (Array.isArray(languages)) {
        languages = languages.join(', ');
    }

    const [updatedQuizAnswer] = await pool.query(`
        UPDATE quiz_answers 
        SET language_preferences = ?
        WHERE user_id = ?
        `, [languages, user_id]
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