import pool from "../config/db.js";

export async function getBookReadData(user_id, book_id) {
    const [bookData] = await pool.query(`
        SELECT * 
        FROM user_books
        WHERE book_id = ? AND user_id = ?
        `, [book_id, user_id]); //prepared statement
    return bookData[0];
}

export async function getUserReadBooks(userId) {
    try {
        const [rows] = await pool.query(`
            SELECT 
            ub.book_id,
            ub.user_id,
            ub.pages_read,
            ub.is_book_completed,
            ub.created_at,
            ub.updated_at,
            b.*,
            GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en
            FROM user_books ub
            JOIN books b ON ub.book_id = b.book_id
            JOIN books_genres bg ON b.book_id = bg.book_id
            JOIN genres g ON bg.genre_id = g.genre_id  
            WHERE ub.user_id = ?
            GROUP BY ub.book_id,
            ub.user_id,
            ub.pages_read,
            ub.is_book_completed,
            ub.created_at,
            ub.updated_at;
            `, [userId]);
            return rows;
    } catch (err) {
        console.error("Error fetching user's books:", err);
        throw new Error("Error fetching user's books");
    }
}

export async function addUserReadBook(user_id, book_id, pages_read) {
    const [newBook] = await pool.query(`
        INSERT INTO user_books (user_id, book_id, pages_read)
        VALUES (?, ?, ?)
        `, [user_id, book_id, pages_read]);

    return newBook;
}

export async function updateBookReadingProgress (user_id, book_id, pages_read) {
    const [updatedBook] = await pool.query(`
        UPDATE user_books
        SET pages_read = ?
        WHERE user_id = ? AND book_id = ?
        `, [pages_read, user_id, book_id]);

    return updatedBook;
}

export async function isBookRead (userId, bookId) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM user_books 
        WHERE user_id = ? AND book_id = ? AND pages_read > 0 AND is_book_completed = FALSE
        `, [userId, bookId]
    );
    return rows.length > 0;
}

export async function isBookCompleted (userId, bookId) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM user_books 
        WHERE user_id = ? AND book_id = ? AND is_book_completed = TRUE
        `, [userId, bookId]
    );
    return rows.length > 0;
}

export async function completeBook (userId, bookId) {
    const [updatedBook] = await pool.query(`
        UPDATE user_books
        SET is_book_completed = TRUE
        WHERE user_id = ? AND book_id = ?
        `, [userId, bookId]);

    return updatedBook;
}