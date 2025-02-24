import pool from "../config/db.js";

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
