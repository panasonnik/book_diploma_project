import { addQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { completeQuizUser } from '../models/userModel.js';
import { calculateBookScores } from '../utils/calculateBookScores.js';
import { getGenres } from '../models/genreModel.js';
import { getLanguages } from '../models/bookModel.js';
import { getTranslations } from '../utils/getTranslations.js';

export async function showQuiz(req, res) {
    try {
        const translations = getTranslations(req);
        const genres = await getGenres();
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
        res.render('quiz', { translations, genres, languages });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading quiz");
    }
}

export async function submitQuiz (req, res) {
    try {
        const { bookLength, bookYear, genre_preferences, language_preferences } = req.body;
        const translations = getTranslations(req);
        const userId = req.user.userId;
        const numOfSelectedGenres = getLength(genre_preferences);
        const numOfSelectedLanguages = getLength(language_preferences);
        const bookLengthWeights = 0.25;
        const bookYearWeights = 0.25;
        // let genreWeights = 0.25/numOfSelectedGenres;
        // let languageWeights = 0.25/numOfSelectedLanguages;
        let muYear = 0;
        let muPages = 0;
        const genreWeights = 0.25;
        const languageWeights = 0.25;

        // let flagShortBook = false;
        // let flagOldBook = false;

        // if(bookLength !== 'longBook') {
        //     flagShortBook = true;
        // }
        // if(bookYear !== 'newBook') {
        //     flagOldBook = true;
        // }
        if(bookLength == 'shortBook') {
          muPages = 200;
        } else if (bookLength == 'mediumBook') {
          muPages = 400;
        } else if (bookLength == 'longBook') {
          muPages = 800;
        }
        if(bookYear == 'oldBook') {
          muYear = 1850;
        } else if (bookYear == 'classicBook') {
          muYear = 1950;
        } else if (bookYear == 'newBook') {
          muYear = 2025;
        }
        const genrePreferencesString = Array.isArray(genre_preferences) ? genre_preferences.join(', ') : genre_preferences;
        const languagePreferencesString = Array.isArray(language_preferences) ? language_preferences.join(', ') : language_preferences;

        await addQuizAnswer(userId, bookLengthWeights, bookYearWeights, genreWeights, languageWeights, genrePreferencesString, languagePreferencesString, muYear, muPages);
        
        req.user = await completeQuizUser(userId);
        const quizAnswer = await getQuizAnswerByUserId(userId);
        await calculateBookScores(quizAnswer);
        res.redirect(`/${translations.lang}/home`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving quiz data.");
    }
}

function getLength(input) {
    if (Array.isArray(input)) {
      return input.length;
    } else if (typeof input === 'string') {
      return input.split(',').length;
    }
    return 0;
  }