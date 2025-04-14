import { getSavedBooks, getUserById, updateUser, getUserByUsername, getUserByEmail } from '../models/userModel.js';
import { getLanguages } from '../models/bookModel.js';
import { getUserReadBooks, getBookReadData } from '../models/userBooksModel.js';
import {updateQuizAnswerLanguages, getQuizAnswerByUserId } from '../models/quizAnswerModel.js';
import { getTranslations } from '../utils/getTranslations.js';
import { translateBook } from '../utils/translationUtils.js';

export async function showProfilePage(req, res) {
    try {
        const userId = req.user.userId;
        const translations = getTranslations(req);
        let savedBooks = await getSavedBooks(userId);
        const user = await getUserById(userId);
        savedBooks = savedBooks.map(book => {
          return translateBook(translations, book);
        });
        res.render('profile', { translations, savedBooks, user });
    } catch (err) {
        console.error("Error rendering profile page:", err);
        res.status(500).send("Error loading profile page");
    }
}

export async function showReadBooksPage(req, res) {
    try {
      const userId = req.user.userId;
      const translations = getTranslations(req);
      let readBooks = await getUserReadBooks(userId);
      const user = await getUserById(userId);
      readBooks = await Promise.all(
        readBooks.map(async (book) => {
          const readingData = await getBookReadData(userId, book.book_id);
        return {
          ...translateBook(translations, book),
          pages_read: readingData.pages_read,
          last_updated: new Date(readingData.updated_at).toLocaleDateString('en-GB')
        }
        })
      );

      res.render('read-books-profile', { translations, readBooks, user });
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