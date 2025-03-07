import { getUserByEmail, getUserByUsername, getUserByEmailOrUsername, addUser, getUsers, hasCompletedQuiz } from '../models/userModel.js';
import { hashPassword, comparePassword, generateToken, setCookie } from '../utils/authUtils.js';

export async function allUsers(req, res) {
    try {
        const users = await getUsers();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
}

export async function registerUser(req, res) {
    const { username, email, password } = req.body;
    try {
        const existingUsername = await getUserByUsername(username);
        if (existingUsername) {
            return res.render('register', {errorDB:null, errorUsername: 'Username already in use', errorEmail:null, data: {username, email}});
        }

        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
            return res.render('register', {errorDB:null, errorUsername:null, errorEmail: 'Email already in use', data: {username, email}});
        }

        const hashedPassword = hashPassword(password);
        const user = await addUser(username, email, hashedPassword);
        const token = generateToken(user.user_id);
        const cookie = setCookie(res, token);
        
        res.status(201).redirect('/quiz');
    } catch (err) {
        console.error(err);
        return res.render('register', {errorDB: 'Database error. Please try again later', errorUsername:null, errorEmail: null, data: null});
    }
}

export async function loginUser(req, res) {
    const { usernameOrEmail, password } = req.body;
    try {
        const user = await getUserByEmailOrUsername(usernameOrEmail);
        if (!user) {
            return res.render('login', {errorDB:null, errorUsername: 'Username/email not found', errorPassword:null, data: {usernameOrEmail}});
        }
        const isPasswordValid = comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.render('login', {errorDB:null, errorUsername: null, errorPassword: 'Incorrect password', data: {usernameOrEmail}});
        }
        const token = generateToken(user.user_id);
        const cookie = setCookie(res, token);
        const hasCompleted = await hasCompletedQuiz(user.user_id);
        if (hasCompleted) {
            return res.status(201).redirect('/home');
        } else {
            return res.status(201).redirect('/quiz');
        }
    } catch (err) {
        console.error(err);
        return res.render('login', {errorDB : 'Database error. Try again later', errorUsername: null, errorPassword:null, data: null});
    }
}

export async function logoutUser(req, res) {
    try {
      res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.redirect('/');
    } catch (err) {
      console.error(err);
      res.status(500).send("Error logging out");
    }
}
