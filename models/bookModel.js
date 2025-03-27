import pool from "../config/db.js";
import { getGenres } from "./genreModel.js";

export async function getBooks() {
    const dbResult = await pool.query("SELECT * FROM books");
    const booksList = dbResult[0];
    return booksList;
}

export async function getBookById(id) {
    const [bookById] = await pool.query(`
        SELECT * 
        FROM books
        WHERE book_id = ?
        `, [id]); //prepared statement
    return bookById[0];
}

export async function getBookByTitle(title) {
    const [bookById] = await pool.query(`
        SELECT * 
        FROM books
        WHERE title_en = ?
        `, [title]);
    return bookById[0];
}

export async function getBooksByGenre() {
    try {
        const genres = await getGenres();
        const booksByGenre = {};

        for (const genre of genres) {
            const [books] = await pool.query(`
                SELECT b.*, 
                GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en,
                GROUP_CONCAT(g.genre_name_uk ORDER BY g.genre_name_uk SEPARATOR ', ') AS genre_name_uk
                FROM books b
                JOIN books_genres bg ON b.book_id = bg.book_id
                JOIN genres g ON bg.genre_id = g.genre_id
                WHERE bg.genre_id = ?
                GROUP BY b.book_id
                `, [genre.genre_id]);
            
            booksByGenre[genre.genre_name_en] = books;
        }
        return booksByGenre;
    } catch (error) {
        console.error("Error fetching books by genre:", error);
        throw new Error("Error fetching books by genre");
    }
}
export async function getBooksWithGenres() {
    const rows = await pool.query(`
        SELECT b.*, 
            GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en,
            GROUP_CONCAT(g.genre_name_uk ORDER BY g.genre_name_uk SEPARATOR ', ') AS genre_name_uk
        FROM books b
        JOIN books_genres bg ON b.book_id = bg.book_id
        JOIN genres g ON bg.genre_id = g.genre_id
        GROUP BY b.book_id;
    `);
    const books = rows[0];
    return books;
}

export async function saveBookPreference(userId, bookId) {
    const [newBookPreference] = await pool.query(`
    INSERT INTO user_book_preferences (user_id, book_id)
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE preference_id = preference_id;
    `, [userId, bookId]);
    return getBookById(newBookPreference.insertId);
}

export async function deleteBookPreference(userId, bookId) {
    const [deletedBookPreference] = await pool.query(`
    DELETE FROM user_book_preferences
    WHERE user_id = ? AND book_id = ?
    `, [userId, bookId]);
    return deletedBookPreference;
}

export async function isBookLiked (userId, bookId) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM user_book_preferences 
        WHERE user_id = ? AND book_id = ?
        `, [userId, bookId]
    );
    return rows.length > 0;
}

export async function isBookRead (userId, bookId) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM user_book_read 
        WHERE user_id = ? AND book_id = ?
        `, [userId, bookId]
    );
    return rows.length > 0;
}

export async function getLanguages() {
    const dbResult = await pool.query("SELECT b.language_en, b.language_uk FROM books b");
    const languagesList = dbResult[0];
    return languagesList;
}

export async function addReadBook(userId, bookId) {
    const [newBookRead] = await pool.query(`
    INSERT INTO user_book_read (user_id, book_id)
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE read_id = read_id;
    `, [userId, bookId]);
    return getBookById(newBookRead.insertId);
}

export async function deleteReadBook (userId, bookId) {
    const [deletedReadBook] = await pool.query(`
        DELETE FROM user_book_read
        WHERE user_id = ? AND book_id = ?
        `, [userId, bookId]);
        return deletedReadBook;
}

