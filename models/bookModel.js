import pool from "../config/db.js";
import { getGenres } from "./genreModel.js";

export async function getBooks() {
    const dbResult = await pool.query("SELECT * FROM books");
    const booksList = dbResult[0];
    return booksList;
}

export async function addBook(title_en, author_en, description_en, image_url, number_of_pages, language_en, year_published) {
    const [newBook] = await pool.query(`
    INSERT INTO books (title_en, author_en, description_en, image_url, number_of_pages, language_en, year_published)
    VALUES (?, ?, ?, ?, ?, ?, ?) 
    ON DUPLICATE KEY UPDATE 
    title_en = VALUES(title_en),
    author_en = VALUES(author_en),
    description_en = VALUES(description_en),
    image_url = VALUES(image_url),
    number_of_pages = VALUES(number_of_pages),
    language_en = VALUES(language_en),
    year_published = VALUES(year_published);
    `, [title_en, author_en, description_en, image_url, number_of_pages, language_en, year_published]);
    return newBook.insertId;
}

export async function getBookPagesMetrics() {
    const [median] = await pool.query(`
        SELECT MIN(number_of_pages) AS min_pages, MAX(number_of_pages) AS max_pages,
        (MIN(number_of_pages) + MAX(number_of_pages)) / 2 AS median
        FROM books
        WHERE number_of_pages IS NOT NULL;
    `);
    return median[0];
}

export async function getBookYearMetrics() {
    const [median] = await pool.query(`
        SELECT MIN(year_published) AS min_year, MAX(year_published) AS max_year,
        (MIN(year_published) + MAX(year_published)) / 2 AS median
        FROM books
        WHERE year_published IS NOT NULL;
    `);
    return median[0];
}

export async function getLanguageCount() {
    const [languages] = await pool.query(`
        SELECT COUNT(DISTINCT TRIM(language_en)) AS different_languages
        FROM books;
    `);
    return languages[0].different_languages;
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
        SELECT b.*,
        GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en 
        FROM books b
        JOIN books_genres bg ON b.book_id = bg.book_id
        JOIN genres g ON bg.genre_id = g.genre_id
        WHERE b.title_en = ?
        GROUP BY b.book_id
        `, [title]);
    return bookById[0];
}

export async function deleteBookFromDB (book_id) {
    const [bookById] = await pool.query(`
       DELETE FROM books
       WHERE book_id = ?
        `, [book_id]);
    return bookById[0];
}
export async function getBooksByGenre() {
    try {
        const genres = await getGenres();
        const booksByGenre = {};

        for (const genre of genres) {
            const [books] = await pool.query(`
                SELECT b.*, 
                GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en
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
        GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en
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

export async function getLanguages() {
    const dbResult = await pool.query("SELECT DISTINCT language_en FROM books;");
    const languagesList = dbResult[0];
    return languagesList;
}

