import pool from "../config/db.js";

export async function getGenres() {
    const dbResult = await pool.query("SELECT * FROM genres");
    const genresList = dbResult[0];
    return genresList;
}

export async function getBookGenre (bookId) {
    const [bookGenre] = await pool.query(`
        SELECT GROUP_CONCAT(g.genre_name ORDER BY g.genre_name SEPARATOR ', ') AS genre_name
        FROM genres g
        JOIN books_genres bg ON g.genre_id = bg.genre_id
        WHERE bg.book_id = ?
        GROUP BY bg.book_id;
        `, [bookId]);
    return bookGenre;
}
