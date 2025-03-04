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

export async function addBook(title, author, description, imageUrl, genre, numberOfPages, language, dateOfPublishing) {
    const [newBook] = await pool.query(`
    INSERT INTO books (title, author, description, imageUrl, genre, numberOfPages, language, dateOfPublishing)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
    `, [title, author, description, imageUrl, genre, numberOfPages, language, dateOfPublishing]);
    return getBookById(newBook.insertId);
}

export async function getBooksByGenre() {
    try {
        const genres = await getGenres();
        const booksByGenre = {};

        for (const genre of genres) {
            const [books] = await pool.query(
                `SELECT b.*, GROUP_CONCAT(g.genre_name ORDER BY g.genre_name SEPARATOR ', ') AS genre_name 
                FROM books b
                JOIN books_genres bg ON b.book_id = bg.book_id
                JOIN genres g ON bg.genre_id = g.genre_id
                WHERE bg.genre_id = ?
                GROUP BY b.book_id`,
                [genre.genre_id]
            );
            
            booksByGenre[genre.genre_name] = books;
        }
        return booksByGenre;
    } catch (error) {
        console.error("Error fetching books by genre:", error);
        throw new Error("Error fetching books by genre");
    }
}
export async function getBooksWithGenres() {

            const rows = await pool.query(
                `SELECT 
                    b.book_id,
                    b.title,
                    b.author,
                    b.description,
                    b.image_url,
                    b.number_of_pages,
                    b.language,
                    b.year_published,
                    GROUP_CONCAT(g.genre_name ORDER BY g.genre_name SEPARATOR ', ') AS genre_name
                FROM 
                    books b
                JOIN 
                    books_genres bg ON b.book_id = bg.book_id
                JOIN 
                    genres g ON bg.genre_id = g.genre_id
                GROUP BY 
                    b.book_id;
                `
            );
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
    const [rows] = await pool.query(
        `SELECT * FROM user_book_preferences WHERE user_id = ? AND book_id = ?`,
        [userId, bookId]
      );
      return rows.length > 0;
}

export async function getLanguages() {
    const dbResult = await pool.query("SELECT b.language FROM books b");
    const languagesList = dbResult[0];
    return languagesList;
}

