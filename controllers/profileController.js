import { getSavedBooks, getUserById, updateUser, getUserByUsername, getUserByEmail, getUserRole } from '../models/userModel.js';
import { getLanguages, isBookLiked } from '../models/bookModel.js';
import { getUserReadBooks, getBookReadData } from '../models/userBooksModel.js';
import { isBookRead, isBookCompleted } from '../models/userBooksModel.js';
import { getTranslations } from '../utils/getTranslations.js';
import { translateBook } from '../utils/translationUtils.js';

export async function showProfilePage(req, res) {
    try {
        const userId = req.user.userId;
        const translations = getTranslations(req);
        let savedBooks = await getSavedBooks(userId);
        const userRole = await getUserRole(userId);
        let isAdmin = false;
        const user = await getUserById(userId);
        for (let book of savedBooks) {
          book.is_read = await isBookRead(userId, book.book_id);
          book.is_completed = await isBookCompleted(userId, book.book_id);
        }
        savedBooks = savedBooks.map(book => {
          return translateBook(translations, book);
        });
        if (userRole === 'admin') {
            isAdmin = true;
        }
        res.render('profile', { translations, savedBooks, user, isAdmin });
    } catch (err) {
        console.error("Error rendering profile page:", err);
        res.status(500).send("Error loading profile page");
    }
}

export async function showReadBooksPage(req, res) {
    try {
      const userId = req.user.userId;
      const translations = getTranslations(req);
      const userRole = await getUserRole(userId);
      let isAdmin = false;
      if (userRole === 'admin') {
         isAdmin = true;
      }
      let readBooks = await getUserReadBooks(userId);
      const user = await getUserById(userId);
      for(let book of readBooks) {
        book.is_liked = await isBookLiked(userId, book.book_id);
        book.is_read = await isBookRead(userId, book.book_id);
        book.is_completed = await isBookCompleted(userId, book.book_id);
      }
      readBooks = await Promise.all(
        readBooks.map(async (book) => {
          const readingData = await getBookReadData(userId, book.book_id);
          return {
            ...translateBook(translations, book),
            pages_read: readingData.pages_read,
            updated_at_raw: readingData.updated_at,
            last_updated: new Date(readingData.updated_at).toLocaleDateString('en-GB')
          };
        })
      );
      readBooks.sort((a, b) => new Date(b.updated_at_raw) - new Date(a.updated_at_raw));

      res.render('read-books-profile', { translations, readBooks, user, isAdmin });
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
              const userRole = await getUserRole(userId);
      let isAdmin = false;
      if (userRole === 'admin') {
         isAdmin = true;
      }
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
        res.render('edit-profile', { translations, user, languages, errorUsername:null, errorEmail:null, isAdmin });
    } catch (err) {
        console.error("Error rendering edit profile page:", err);
        res.status(500).send("Error loading edit profile page");
    }
}

export async function saveProfileChanges(req, res) {
    try {
        const { username, email } = req.body;
        const translations = getTranslations(req);
        const userId = req.user.userId;
        const user = await getUserById(userId);
        
        const existingUsername = await getUserByUsername(username);

        if (existingUsername && username !== user.username) {
            return res.render('edit-profile', {translations, errorDB:null, errorUsername: 'Username already in use', errorEmail:null, languages: bookLanguages, user});
        }
            
        const existingEmail = await getUserByEmail(email);
        if (existingEmail && email !== user.email) {
            return res.render('edit-profile', {translations, errorDB:null, errorUsername:null, errorEmail: 'Email already in use', languages: bookLanguages, user});
        }

        await updateUser(userId, username, email);
        res.redirect(`/${translations.lang}/profile`);
        } catch (error) {
            console.error(error);
            res.status(500).send("Error saving quiz data.");
        }
}