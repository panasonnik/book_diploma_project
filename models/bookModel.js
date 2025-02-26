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
        WHERE id = ?
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
                `SELECT books.* FROM books
                JOIN books_genres ON books.book_id = books_genres.book_id
                WHERE books_genres.genre_id = ?`,
                [genre.genre_id]
            );
            booksByGenre[genre.name] = books;
        }
        return booksByGenre;
    } catch (error) {
        console.error("Error fetching books by genre:", error);
        throw new Error("Error fetching books by genre");
    }
}

