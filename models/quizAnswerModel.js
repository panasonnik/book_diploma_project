import pool from "../config/db.js";

export async function addQuizAnswer(user_id, weights_number_of_pages, weights_year_published, weights_genre, weights_language, genre_preferences, language_preferences, preferred_length, preferred_year) {
    if (Array.isArray(genre_preferences)) {
        genre_preferences = genre_preferences.join(', ');
    }
    if (Array.isArray(language_preferences)) {
        language_preferences = language_preferences.join(', ');
    }
    const [newQuizAnswer] = await pool.query(`
    INSERT INTO quiz_answers (user_id, weights_number_of_pages, weights_year_published, weights_genre, weights_language, genre_preferences, language_preferences, preferred_length, preferred_year, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) 
    ON DUPLICATE KEY UPDATE 
    weights_number_of_pages = VALUES(weights_number_of_pages),
    weights_year_published = VALUES(weights_year_published),
    weights_genre = VALUES(weights_genre),
    weights_language = VALUES(weights_language),
    genre_preferences = VALUES(genre_preferences),
    language_preferences = VALUES(language_preferences),
    preferred_length = VALUES(preferred_length),
    preferred_year = VALUES(preferred_year),
    created_at = NOW()
    `, [user_id, weights_number_of_pages, weights_year_published, weights_genre, weights_language, genre_preferences, language_preferences, preferred_length, preferred_year]);
    return newQuizAnswer.insertId;
}

export async function updateQuizAnswer(user_id, weights_number_of_pages, weights_year_published, weights_genre, weights_language, genres, languages) {
    if (Array.isArray(genres)) {
        genres = genres.join(', ');
    }
    if (Array.isArray(languages)) {
        languages = languages.join(', ');
    }
    const [updatedQuizAnswer] = await pool.query(`
        UPDATE quiz_answers 
        SET weights_number_of_pages = ?, weights_year_published = ?, weights_genre = ?, weights_language = ?, genre_preferences = ?, language_preferences = ?
        WHERE user_id = ?
        `, [weights_number_of_pages, weights_year_published, weights_genre, weights_language, genres, languages, user_id]
    );
    return updatedQuizAnswer;
}

export async function updateCriteriaDirectionQuizAnswer(user_id, goal_year, goal_pages) {
    const [updatedQuizAnswer] = await pool.query(`
        UPDATE quiz_answers 
        SET goal_year = ?, goal_pages = ?
        WHERE user_id = ?
        `, [goal_year, goal_pages, user_id]
    );
    return updatedQuizAnswer;
}

export async function updateQuantitativeCriterionsQuizAnswer(user_id, preferred_length, preferred_year) {
    const [updatedQuizAnswer] = await pool.query(`
        UPDATE quiz_answers 
        SET preferred_length = ?, preferred_year = ?
        WHERE user_id = ?
        `, [preferred_length, preferred_year, user_id]
    );
    return updatedQuizAnswer;
}

export async function updateGenreLanguagePreferences(user_id, genres, languages) {
    
    if (Array.isArray(languages)) {
        languages = languages.join(', ');
    }
    if (Array.isArray(genres)) {
        genres = genres.join(', ');
    }

    const [updatedQuizAnswer] = await pool.query(`
        UPDATE quiz_answers 
        SET genre_preferences = ?, language_preferences = ?
        WHERE user_id = ?
        `, [genres, languages, user_id]
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

export async function getPagesRange(userId) {
    const [pages] = await pool.query(`
       SELECT min_pages, max_pages
       FROM quiz_answers
       WHERE user_id = ? 
    `, [userId]);
    return pages[0];
}

export async function getYearRange(userId) {
    const [years] = await pool.query(`
        SELECT min_year, max_year
        FROM quiz_answers
        WHERE user_id = ? 
     `, [userId]);
     return years[0];
}