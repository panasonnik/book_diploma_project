import pool from "../config/db.js";

export async function getGenres() {
    const dbResult = await pool.query("SELECT * FROM genres");
    const genresList = dbResult[0];
    return genresList;
}
