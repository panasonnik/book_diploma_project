import { getUserByEmail, getUserByUsername, getUserByEmailOrUsername, addUser, hasCompletedQuiz } from '../models/userModel.js';
import { hashPassword, comparePassword, generateToken, setCookie } from '../utils/authUtils.js';
import { updateBookScoresReadBooks, updateBookScoresLikedBooks } from '../utils/updateBookScores.js';
import { getTranslations } from '../utils/getTranslations.js';
import { updateUserBookReading } from '../utils/updateUserPreferences.js';

export async function registerUser(req, res) {
    const { username, email, password } = req.body;
    const translations = getTranslations(req);
    try {
        const existingUsername = await getUserByUsername(username);
        if (existingUsername) {
            return res.render('register', {translations, errorDB:null, errorUsername: 'Username already in use', errorEmail:null, data: {username, email}});
        }

        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
            return res.render('register', {translations, errorDB:null, errorUsername:null, errorEmail: 'Email already in use', data: {username, email}});
        }

        const hashedPassword = hashPassword(password);
        const user = await addUser(username, email, hashedPassword);
        const token = generateToken(user.user_id);
        const cookie = setCookie(res, token);
        
        res.status(201).redirect(`/${translations.lang}/quiz`);
    } catch (err) {
        console.error(err);
        return res.render('register', {translations, errorDB: 'Database error. Please try again later', errorUsername:null, errorEmail: null, data: null});
    }
}

export async function loginUser(req, res) {
    const { usernameOrEmail, password } = req.body;
    const translations = getTranslations(req);
    try {
        const user = await getUserByEmailOrUsername(usernameOrEmail);
        if (!user) {
            return res.render('login', {translations, errorDB:null, errorUsername: 'Username/email not found', errorPassword:null, data: {usernameOrEmail}});
        }
        const isPasswordValid = comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.render('login', {translations, errorDB:null, errorUsername: null, errorPassword: 'Incorrect password', data: {usernameOrEmail}});
        }
        const token = generateToken(user.user_id);
        const cookie = setCookie(res, token);
        const hasCompleted = await hasCompletedQuiz(user.user_id);
        if (hasCompleted) {
            return res.status(201).redirect(`/${translations.lang}/home`);
        } else {
            return res.status(201).redirect(`/${translations.lang}/quiz`);
        }
    } catch (err) {
        console.error(err);
        return res.render('login', {translations, errorDB : 'Database error. Try again later', errorUsername: null, errorPassword:null, data: null});
    }
}

export async function logoutUser(req, res) {
    try {
        const translations = getTranslations(req);
        await updateUserBookReading(req.user.userId); //updates user preferences (year, length, genres, languages)
        if (req.session.isBooksReadModified) {
            await updateBookScoresReadBooks(req.user.userId);
        }
        Object.keys(req.cookies).forEach(cookieName => {
            res.clearCookie(cookieName, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        });
        req.session.isBooksReadModified = false;
        res.redirect(`/${translations.lang}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error logging out");
    }
}
