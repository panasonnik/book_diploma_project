import pool from "../config/db.js";

export async function getGenres() {
    const dbResult = await pool.query("SELECT * FROM genres");
    const genresList = dbResult[0];
    return genresList;
}

export async function addBookGenre(book_id, genre_id) {
    const [newRow] = await pool.query(`
    INSERT INTO books_genres (book_id, genre_id)
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE 
    book_id = VALUES(book_id),
    genre_id = VALUES(genre_id);
    `, [book_id, genre_id]);
    return newRow.insertId;
}

export async function addGenre (genre_name_en) {
    const [newRow] = await pool.query(`
    INSERT INTO genres (genre_name_en)
    VALUES (?) 
    ON DUPLICATE KEY UPDATE 
    genre_name_en = VALUES(genre_name_en);
    `, [genre_name_en]);
    return newRow.insertId;
}

export async function getBookGenre (bookId) {
    const [bookGenre] = await pool.query(`
        SELECT GROUP_CONCAT(g.genre_name_en ORDER BY g.genre_name_en SEPARATOR ', ') AS genre_name_en
        FROM genres g
        JOIN books_genres bg ON g.genre_id = bg.genre_id
        WHERE bg.book_id = ?
        GROUP BY bg.book_id;
        `, [bookId]);
    return bookGenre[0].genre_name_en;
}

export async function getGenreIdByName (name) {
    const [genreId] = await pool.query(`
        SELECT g.*
        FROM genres g
        WHERE g.genre_name_en = ?;
        `, [name, name]);
    return genreId[0].genre_id;
}
