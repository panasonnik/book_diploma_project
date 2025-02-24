import pool from "../config/db.js";

export async function getUsers() {
    const dbResult = await pool.query("SELECT * FROM users");
    const usersList = dbResult[0];
    return usersList;
}

export async function getUserById(id) {
    const [userById] = await pool.query(`
        SELECT * 
        FROM users
        WHERE user_id = ?
        `, [id]); //prepared statement
    return userById[0];
}
export async function getUserByEmail (email) {
    const [userByEmail] = await pool.query(`
        SELECT * 
        FROM users
        WHERE email = ?`, [email]);
    return userByEmail[0];
}
export async function getUserByUsername (username) {
    const [userByUsername] = await pool.query(`
        SELECT * 
        FROM users
        WHERE email = ?`, [username]);
    return userByUsername[0];
}
export async function getUserByEmailOrUsername (emailOrUsername) {
    const [userByEmailOrUsername] = await pool.query(`
        SELECT * 
        FROM users
        WHERE email = ? OR username = ?`, [emailOrUsername, emailOrUsername]);
    return userByEmailOrUsername[0];
}
  
export async function addUser(username, email, password) {
    const [newUser] = await pool.query(`
    INSERT INTO users (username, email, password)
    VALUES (?, ?, ?) 
    `, [username, email, password]);
    return getUserById(newUser.insertId);
}