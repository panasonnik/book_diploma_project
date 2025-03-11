import { getSavedBooks, getUserById, updateUser, getUserByUsername, getUserByEmail } from '../models/userModel.js';
import { getLanguages } from '../models/bookModel.js';
import {updateQuizAnswerLanguages, getQuizAnswerByUserId } from '../models/quizAnswerModel.js';
import { calculateBookScores } from '../utils/calculateBookScores.js';
import { getTranslations } from '../utils/getTranslations.js';

export async function showProfilePage(req, res) {
    try {
        const userId = req.user.userId;
        const translations = getTranslations(req);
        const savedBooks = await getSavedBooks(userId);
        const user = await getUserById(userId);
        res.render('profile', { translations, savedBooks, user });
    } catch (err) {
        console.error("Error rendering profile page:", err);
        res.status(500).send("Error loading profile page");
    }
}

export async function showEditProfilePage(req, res) {
    try {
        const userId = req.user.userId;
        const translations = getTranslations(req);
        const user = await getUserById(userId);
        const languagesObj = await getLanguages();
        let languages = [];

        for (let i = 0; i < languagesObj.length; i++) {
          let isDuplicate = false;

          for (let j = 0; j < languages.length; j++) {
            if (languagesObj[i].language_en === languages[j].language_en &&
                languagesObj[i].language_uk === languages[j].language_uk) {
              isDuplicate = true;
              break;
            }
          }
        
          if (!isDuplicate) {
            languages.push(languagesObj[i]);
          }
        }
        console.log(languages);
        res.render('edit-profile', { translations, user, languages, errorUsername:null, errorEmail:null });
    } catch (err) {
        console.error("Error rendering edit profile page:", err);
        res.status(500).send("Error loading edit profile page");
    }
}

export async function saveProfileChanges(req, res) {
    try {
        const { username, email, languages } = req.body;
        const translations = getTranslations(req);
        const userId = req.user.userId;
        const user = await getUserById(userId);
        const languagesObj = await getLanguages();
        let bookLanguages = [];

        for (let i = 0; i < languagesObj.length; i++) {
          let isDuplicate = false;

          for (let j = 0; j < bookLanguages.length; j++) {
            if (languagesObj[i].language_en === bookLanguages[j].language_en &&
                languagesObj[i].language_uk === bookLanguages[j].language_uk) {
              isDuplicate = true;
              break;
            }
          }
        
          if (!isDuplicate) {
            bookLanguages.push(languagesObj[i]);
          }
        }
        const languagePreferencesString = Array.isArray(languages) ? languages.join(', ') : languages;
        const existingUsername = await getUserByUsername(username);

        if (existingUsername && username !== user.username) {
            return res.render('edit-profile', {translations, errorDB:null, errorUsername: 'Username already in use', errorEmail:null, languages: bookLanguages, user});
        }
            
        const existingEmail = await getUserByEmail(email);
        if (existingEmail && email !== user.email) {
            return res.render('edit-profile', {translations, errorDB:null, errorUsername:null, errorEmail: 'Email already in use', languages: bookLanguages, user});
        }

        await updateUser(userId, username, email);
        await updateQuizAnswerLanguages(userId, languagePreferencesString);
            
        const quizAnswer = await getQuizAnswerByUserId(userId);
        //await calculateBookScores(quizAnswer);
        res.redirect(`/${translations.lang}/profile`);
        } catch (error) {
            console.error(error);
            res.status(500).send("Error saving quiz data.");
        }
}