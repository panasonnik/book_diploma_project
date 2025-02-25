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
        WHERE username = ?`, [username]);
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

export async function hasCompletedQuiz(id) {
    try {
        const [rows] = await pool.execute('SELECT has_compeleted_quiz FROM users WHERE id = ?', [id]);
        
        if (rows.length > 0) {
            return rows[0].has_completed_quiz;
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}