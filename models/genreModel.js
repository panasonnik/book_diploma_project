import pool from "../config/db.js";

export async function getGenres() {
    const dbResult = await pool.query("SELECT * FROM genres");
    const genresList = dbResult[0];
    return genresList;
}

export async function getBookGenre (bookId) {
    const [bookGenre] = await pool.query(`
        SELECT GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en,
            GROUP_CONCAT(g.genre_name_uk ORDER BY g.genre_name_uk SEPARATOR ', ') AS genre_name_uk
        FROM genres g
        JOIN books_genres bg ON g.genre_id = bg.genre_id
        WHERE bg.book_id = ?
        GROUP BY bg.book_id;
        `, [bookId]);
    return bookGenre;
}

export async function getGenreIdByName (name) {
    const [genreId] = await pool.query(`
        SELECT g.*
        FROM genres g
        WHERE g.genre_name_en = ? OR g.genre_name_uk = ?;
        `, [name, name]);
    return genreId[0].genre_id;
}
