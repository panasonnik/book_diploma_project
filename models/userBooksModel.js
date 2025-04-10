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
            SELECT b.*,
            GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en
            FROM user_books ub
            JOIN books b ON ub.book_id = b.book_id
            JOIN books_genres bg ON b.book_id = bg.book_id
            JOIN genres g ON bg.genre_id = g.genre_id  
            WHERE ub.user_id = ?
            GROUP BY b.book_id;
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