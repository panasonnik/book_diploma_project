import { getUserBooks, getSavedBooks, getUserById, updateUser, getUserByUsername, getUserByEmail } from '../models/userModel.js';
import { getBooksByGenre, isBookLiked, getLanguages, getBooksWithGenres } from '../models/bookModel.js';
import {updateQuizAnswerLanguages, getQuizAnswerByUserId, updateQuizAnswerPreferences} from '../models/quizAnswerModel.js';
import { calculateBookScores } from '../utils/calculateBookScores.js';
import { getTranslations } from '../utils/getTranslations.js';

export async function showHomepage(req, res) {
    try {
        const userId = req.user.userId;
        const translations = getTranslations(req);
        const lang = translations.lang;
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

        res.render('homepage', { translations, books: books.slice(0,4), booksByGenre });

    } catch (err) {
        console.error("Error rendering homepage:", err);
        res.status(500).send("Error loading homepage");
    } 
}

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
        await calculateBookScores(quizAnswer);
        res.redirect('/profile');
        } catch (error) {
            console.error(error);
            res.status(500).send("Error saving quiz data.");
        }
}

export async function updateBookScoresBasedOnLikes (req,res) {
    const userId = req.user.userId;
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const savedBooks = await getSavedBooks(userId);
    const allBooks = await getBooksWithGenres();
    console.log("Saved books: ", savedBooks);
    let genres = [quizAnswer.genre_preferences];
    let languages = [quizAnswer.language_preferences];
    let sumOfYears = 0;
    let sumOfPages = 0;
    let likesOldBooksFlag = false;
    let likesShortBooksFlag = false;
    for(let book of savedBooks) {
        sumOfYears += book.year_published;
        sumOfPages += book.number_of_pages;
    }
    let avgSavedYear = sumOfYears/savedBooks.length;
    let avgSavedPages = sumOfPages/savedBooks.length;
    let avgBookYear = (allBooks.reduce((sum, book) => sum + book.year_published, 0))/allBooks.length;
    let avgBookPages = (allBooks.reduce((sum, book) => sum + book.number_of_pages, 0))/allBooks.length;

    if(avgSavedYear < avgBookYear) {
        likesOldBooksFlag = true;
    }
    if(avgSavedPages < avgBookPages) {
        likesShortBooksFlag = true;
    }
    const mostFrequentGenres = findMostFrequentGenres(savedBooks);
    genres = genres[0].split(', ').map(genre => genre.trim());
    let genresWithoutDuplicates = [...new Set(genres.concat(mostFrequentGenres))];
    await updateQuizAnswerPreferences(userId, 0.25/genresWithoutDuplicates.length, 0.25/languages.length, likesOldBooksFlag, likesShortBooksFlag, genresWithoutDuplicates, languages);
    res.redirect('/home');
}

function findMostFrequentGenres(books) {
    const genres = books.flatMap(book => book.genre_name.split(',').map(genre => genre.trim()));
  const genreCounts = genres.reduce((counts, genre) => {
    counts[genre] = (counts[genre] || 0) + 1;
    return counts;
  }, {});

  const maxCount = Math.max(...Object.values(genreCounts));
  return Object.keys(genreCounts).filter(genre => genreCounts[genre] === maxCount);
  }

