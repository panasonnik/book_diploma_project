import pool from "../config/db.js";

export async function getUserById(id) {
    const [userById] = await pool.query(`
        SELECT u.user_id, u.username, u.email, u.has_completed_quiz,
        IFNULL(GROUP_CONCAT(qa.language_preferences ORDER BY qa.language_preferences SEPARATOR ', '), '') AS languages
        FROM users u
        LEFT JOIN quiz_answers qa ON u.user_id = qa.user_id
        WHERE u.user_id = ?
        GROUP BY u.user_id;
        `, [id]);
    return userById[0];
}
export async function getUserByEmail (email) {
    const [userByEmail] = await pool.query(`
        SELECT * 
        FROM users
        WHERE email = ?
        `, [email]);
    return userByEmail[0];
}
export async function getUserByUsername (username) {
    const [userByUsername] = await pool.query(`
        SELECT * 
        FROM users
        WHERE username = ?
        `, [username]
    );
    return userByUsername[0];
}
export async function getUserByEmailOrUsername (emailOrUsername) {
    const [userByEmailOrUsername] = await pool.query(`
        SELECT * 
        FROM users
        WHERE email = ? OR username = ?
        `, [emailOrUsername, emailOrUsername]
    );
    return userByEmailOrUsername[0];
}
  
export async function addUser(username, email, password) {
    const [newUser] = await pool.query(`
        INSERT INTO users (username, email, password)
        VALUES (?, ?, ?) 
        `, [username, email, password]
    );
    return getUserById(newUser.insertId);
}

export async function updateUser(user_id, username, email) {
    const [updatedUser] = await pool.query(`
        UPDATE users 
        SET username = ?, email = ?
        WHERE user_id = ?
        `, [username, email, user_id]
    );
    return updatedUser;
}

export async function hasCompletedQuiz(id) {
    try {
        const [rows] = await pool.execute('SELECT has_completed_quiz FROM users WHERE user_id = ?', [id]);
        if (rows.length > 0) {
            return rows[0].has_completed_quiz;
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function completeQuizUser(id) {
    try {
        await pool.query(`
            UPDATE users 
            SET has_completed_quiz = TRUE 
            WHERE user_id = ?
            `, [id]
        );
        return getUserById(id);
    } catch (error) {
        console.error("Error updating quiz status:", error);
        return { success: false, message: "Database error" };
    }
}

export async function getUserBooks(userId) {
    try {
        const [rows] = await pool.query(`
            SELECT b.*, ubs.book_score, 
            GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en
            FROM books b
            INNER JOIN user_book_scores ubs ON b.book_id = ubs.book_id
            LEFT JOIN books_genres bg ON b.book_id = bg.book_id
            LEFT JOIN genres g ON bg.genre_id = g.genre_id
            WHERE ubs.user_id = ? AND ubs.book_score != 0
            GROUP BY b.book_id, ubs.book_score
            ORDER BY ubs.book_score DESC;
        `, [userId]);
        return rows;
    } catch (err) {
        console.error("Error fetching user's books:", err);
        throw new Error("Error fetching user's books");
    }
}

export async function getSavedBooks(userId) {
    try {
        const [rows] = await pool.query(`
            SELECT 
    b.book_id,
    b.title_en,
    b.author_en,
    b.description_en,
    b.language_en,
    b.image_url,
    b.number_of_pages,
    b.year_published,
    GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en,
    ub.read_progress
FROM 
    user_book_preferences p
JOIN 
    books b ON p.book_id = b.book_id
JOIN 
    books_genres bg ON b.book_id = bg.book_id
JOIN 
    genres g ON bg.genre_id = g.genre_id  
LEFT JOIN 
    user_books ub ON b.book_id = ub.book_id AND ub.user_id = p.user_id  
WHERE 
    p.user_id = ?            
GROUP BY 
    b.book_id, ub.read_progress;

            `, [userId]);
            return rows;
    } catch (err) {
        console.error("Error fetching user's books:", err);
        throw new Error("Error fetching user's books");
    }
}

export async function getUserRole(id) {
    try {
        const [rows] = await pool.execute('SELECT role FROM users WHERE user_id = ?', [id]);
        return rows[0].role;
    } catch (error) {
        console.error(error);
        return false;
    }
}
