import { addQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { completeQuizUser } from '../models/userModel.js';
import { calculateBookScores } from '../utils/calculateBookScores.js';
import { getGenres, getGenreIdByName } from '../models/genreModel.js';
import { getLanguages } from '../models/bookModel.js';
import { getTranslations } from '../utils/getTranslations.js';
import { getUserReadBooks } from '../models/userBooksModel.js';
import { addUserGenresScore, clearUserGenresScore, getUserGenresScore, getUserGenresWeights } from '../models/userGenresWeightsModel.js';
import { normalize } from "../utils/mathOperationsUtils.js";
import { deleteBookScores } from "../models/userBookScoreModel.js";
import { getPagesRange, getYearRange } from "../models/appSettingsModel.js";
import { getTopTwoByReadCount } from '../utils/userBookReadUtils.js';

export async function showQuiz(req, res) {
    try {
        const translations = getTranslations(req);
        const genres = await getGenres();
        const languages = await getLanguages();
        const pageData = await getPagesRange();
        const yearData = await getYearRange();
        
        res.render('quiz', { translations, genres, languages, lowerPageBound: pageData[0].pages_median_min, upperPageBound: pageData[0].pages_median_max, lowerYearBound: yearData[0].year_median_min, upperYearBound: yearData[0].year_median_max });
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
        
        const languages = await getLanguages();
        const genrePreferencesArray = Array.isArray(genre_preferences) ? genre_preferences : genre_preferences.split(', ');
        const languagePreferencesArray = Array.isArray(language_preferences) ? language_preferences : language_preferences.split(', ');
       
        let bookLengthWeights = 0.25;
        let bookYearWeights = 0.25;
        let genreWeights = 0.25;
        let languageWeights = 0.25;

        if(languages.length == languagePreferencesArray.length) {
          //user selected all languages, then weight = 0
          bookLengthWeights = 1/3;
          bookYearWeights = 1/3;
          genreWeights = 1/3;
          languageWeights = 0;
        }
        // let genreWeights = 0.25/numOfSelectedGenres;
        // let languageWeights = 0.25/numOfSelectedLanguages;
        

        await clearUserGenresScore(userId);
        const genreIds = await Promise.all(genrePreferencesArray.map(async (element) => {
            const genreId = await getGenreIdByName(element);
            await addUserGenresScore(userId, genreId, genreWeights/genrePreferencesArray.length, 1);
        }));

        let bookLengthPreference = bookLength.replace("Book", "");
        let bookYearPreference = bookYear.replace("Book", "");

        await addQuizAnswer(userId, bookLengthWeights, bookYearWeights, genreWeights, languageWeights, genrePreferencesArray, languagePreferencesArray, bookLengthPreference, bookYearPreference);
        req.user = await completeQuizUser(userId);
        const quizAnswer = await getQuizAnswerByUserId(userId);
        const initialQuizFlag = true;
        await calculateBookScores(quizAnswer, initialQuizFlag);
        res.redirect(`/${translations.lang}/home`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving quiz data.");
    }
}

export async function showRetakeQuiz(req, res) {
  try {
      const translations = getTranslations(req);
      const genres = await getGenres();
      const languagesObj = await getLanguages();
      const pageData = await getPagesRange();
      const yearData = await getYearRange();
      const quizAnswer = await getQuizAnswerByUserId(req.user.userId);
      const userReadBooks = await getUserReadBooks(req.user.userId);
      const isAdmin = false;
      let userMostReadGenres;
      // if(userReadBooks.length === 0) {
      //   userMostReadGenres = await getUserGenresWeights(req.user.userId);
      // } else {
      //   userMostReadGenres = await getUserGenresScore(req.user.userId);
      // }
      userMostReadGenres = await getUserGenresWeights(req.user.userId);
      //console.log(userMostReadGenres);
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
      let weights = {
        numberOfPages: quizAnswer.weights_number_of_pages,
        yearPublished: quizAnswer.weights_year_published,
        genre: quizAnswer.weights_genre,
        language: quizAnswer.weights_language,
      };
      let preferences = {
        numberOfPages: quizAnswer.preferred_length,
        yearPublished: quizAnswer.preferred_year,
        genre: getTopTwoByReadCount(userMostReadGenres),
        language: quizAnswer.language_preferences,
      };
      //console.log(preferences.genre);
      res.render('quiz-reevaluation', { isAdmin, translations, genres, languages, weights, preferences, lowerPageBound: pageData[0].pages_median_min, upperPageBound: pageData[0].pages_median_max, lowerYearBound: yearData[0].year_median_min, upperYearBound: yearData[0].year_median_max });
  } catch (err) {
      console.error(err);
      res.status(500).send("Error loading quiz");
  }
}

export async function submitRetakeQuiz (req, res) {
  try {
      const { bookLengthWeights, bookYearWeights, genreWeights, languageWeights, bookLength, bookYear, genre_preferences, language_preferences } = req.body;
      const translations = getTranslations(req);
      const userId = req.user.userId;
      const [normPagesWeights, normYearWeights, normGenreWeights, normLangWeights] = normalize(Number(bookLengthWeights), Number(bookYearWeights), Number(genreWeights), Number(languageWeights));

      const genrePreferencesArray = Array.isArray(genre_preferences) ? genre_preferences : genre_preferences.split(', ');
      const languagePreferencesArray = Array.isArray(language_preferences) ? language_preferences : language_preferences.split(', ');
      await clearUserGenresScore(userId);
      const genreIds = await Promise.all(genrePreferencesArray.map(async (element) => {
          const genreId = await getGenreIdByName(element);
          await addUserGenresScore(userId, genreId, normGenreWeights/genrePreferencesArray.length, 1);
      }));
      let bookLengthPreference = bookLength.replace("Book", "");
      let bookYearPreference = bookYear.replace("Book", "");
      await addQuizAnswer(userId, normPagesWeights, normYearWeights, normGenreWeights, normLangWeights, genrePreferencesArray, languagePreferencesArray, bookLengthPreference, bookYearPreference);
      
      const quizAnswer = await getQuizAnswerByUserId(userId);
      await deleteBookScores(userId);
      const initialQuizFlag = true;
      await calculateBookScores(quizAnswer, initialQuizFlag);
      res.redirect(`/${translations.lang}/home`);
  } catch (error) {
      console.error(error);
      res.status(500).send("Error saving quiz data.");
  }
}