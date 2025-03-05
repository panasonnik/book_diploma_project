import { getUserBooks, getSavedBooks, getUserById, updateUser, getUserByUsername, getUserByEmail } from '../models/userModel.js';
import { getBooksByGenre, isBookLiked, getLanguages } from '../models/bookModel.js';
import {updateQuizAnswerLanguages, getQuizAnswerByUserId} from '../models/quizAnswerModel.js';
import { calculateBookScores } from '../utils/calculateBookScores.js';

export async function showHomepage(req, res) {
    try {
        const userId = req.user.userId;
        const books = await getUserBooks(userId);
        const booksByGenre = await getBooksByGenre();

        for (let book of books) {
            book.is_liked = await isBookLiked(userId, book.book_id);
        }

        for (let genre in booksByGenre) {
            if (Array.isArray(booksByGenre[genre])) {
                for (let book of booksByGenre[genre]) {
                    book.is_liked = await isBookLiked(userId, book.book_id);
                }
            }
        }

        res.render('homepage', { books: books.slice(0,4), booksByGenre });

    } catch (err) {
        console.error("Error rendering homepage:", err);
        res.status(500).send("Error loading homepage");
    }
    
}

export async function showProfilePage(req, res) {
    try {
        const userId = req.user.userId;
        const savedBooks = await getSavedBooks(userId);
        const user = await getUserById(userId);
        res.render('profile', { savedBooks, user });
    } catch (err) {
        console.error("Error rendering profile page:", err);
        res.status(500).send("Error loading profile page");
    }
}

export async function showEditProfilePage(req, res) {
    try {
        const userId = req.user.userId;
        const user = await getUserById(userId);
        const languagesObj = await getLanguages();
        const languages = [...new Set(languagesObj.map(item => item.language))];
        res.render('edit-profile', { user, languages, errorUsername:null, errorEmail:null });
    } catch (err) {
        console.error("Error rendering edit profile page:", err);
        res.status(500).send("Error loading edit profile page");
    }
}

export async function saveProfileChanges(req, res) {
    try {
            const { username, email, languages } = req.body;
            const userId = req.user.userId;
            const user = await getUserById(userId);
            const languagesObj = await getLanguages();
            const bookLanguages = [...new Set(languagesObj.map(item => item.language))];
            const languagePreferencesString = Array.isArray(languages) ? languages.join(', ') : languages;
            const existingUsername = await getUserByUsername(username);

            if (existingUsername && username !== user.username) {
                return res.render('edit-profile', {errorDB:null, errorUsername: 'Username already in use', errorEmail:null, languages: bookLanguages, user});
            }
            
            const existingEmail = await getUserByEmail(email);
            if (existingEmail && email !== user.email) {
                return res.render('edit-profile', {errorDB:null, errorUsername:null, errorEmail: 'Email already in use', languages: bookLanguages, user});
            }

            await updateUser(userId, username, email);
            await updateQuizAnswerLanguages(userId, languagePreferencesString);
            
            const quizAnswer = await getQuizAnswerByUserId(userId);
            await calculateBookScores(quizAnswer);
            res.redirect('/profile/edit');
        } catch (error) {
            console.error(error);
            res.status(500).send("Error saving quiz data.");
        }
}
