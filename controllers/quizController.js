import { addQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { completeQuizUser } from '../models/userModel.js';
import { calculateBookScores } from '../utils/calculateBookScores.js';
import { getGenres, getGenreIdByName } from '../models/genreModel.js';
import { getLanguages } from '../models/bookModel.js';
import { getTranslations } from '../utils/getTranslations.js';
import { addUserGenresScore, clearUserGenresScore} from '../models/userGenresWeightsModel.js';
import { topsis } from '../utils/topsis.js';
import { normalize } from "../utils/mathOperationsUtils.js";
import { deleteBookScores } from "../models/userBookScoreModel.js";

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
        const bookLengthWeights = 0.25;
        const bookYearWeights = 0.25;
        // let genreWeights = 0.25/numOfSelectedGenres;
        // let languageWeights = 0.25/numOfSelectedLanguages;
        let goalYear = 'max';
        let goalPages = 'max';
        const genreWeights = 0.25;
        const languageWeights = 0.25;

        if(bookLength === 'shortBook') {
          goalPages = 'min';
        }

        if(bookYear === 'oldBook') {
          goalYear = 'min';
        }   

        const genrePreferencesArray = Array.isArray(genre_preferences) ? genre_preferences : genre_preferences.split(', ');
        const languagePreferencesArray = Array.isArray(language_preferences) ? language_preferences : language_preferences.split(', ');

        const genreIds = await Promise.all(genrePreferencesArray.map(async (element) => {
            const genreId = await getGenreIdByName(element);
            await addUserGenresScore(userId, genreId.genre_id, genreWeights/genrePreferencesArray.length, 1);
        }));

        let bookLengthPreference = bookLength.replace("Book", "");
        let bookYearPreference = bookYear.replace("Book", "");

        await addQuizAnswer(userId, bookLengthWeights, bookYearWeights, genreWeights, languageWeights, genrePreferencesArray, languagePreferencesArray, goalYear, goalPages, bookLengthPreference, bookYearPreference);
        

        req.user = await completeQuizUser(userId);
        const quizAnswer = await getQuizAnswerByUserId(userId);
        await calculateBookScores(quizAnswer);
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
      const quizAnswer = await getQuizAnswerByUserId(req.user.userId);
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
        genre: quizAnswer.genre_preferences,
        language: quizAnswer.language_preferences,
      };
      res.render('quiz-reevaluation', { translations, genres, languages, weights, preferences });
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
      let goalYear = 'max';
      let goalPages = 'max';

      if(bookLength === 'shortBook') {
        goalPages = 'min';
      }

      if(bookYear === 'oldBook') {
        goalYear = 'min';
      }   

      const genrePreferencesArray = Array.isArray(genre_preferences) ? genre_preferences : genre_preferences.split(', ');
      const languagePreferencesArray = Array.isArray(language_preferences) ? language_preferences : language_preferences.split(', ');
      await clearUserGenresScore(userId);
      const genreIds = await Promise.all(genrePreferencesArray.map(async (element) => {
          const genreId = await getGenreIdByName(element);
          await addUserGenresScore(userId, genreId.genre_id, normGenreWeights/genrePreferencesArray.length, 1);
      }));
      let bookLengthPreference = bookLength.replace("Book", "");
      let bookYearPreference = bookYear.replace("Book", "");
      await addQuizAnswer(userId, normPagesWeights, normYearWeights, normGenreWeights, normLangWeights, genrePreferencesArray, languagePreferencesArray, goalYear, goalPages, bookLengthPreference, bookYearPreference);
      
      const quizAnswer = await getQuizAnswerByUserId(userId);
      await deleteBookScores(userId);
      await calculateBookScores(quizAnswer);
      await topsis(quizAnswer);
      res.redirect(`/${translations.lang}/home`);
  } catch (error) {
      console.error(error);
      res.status(500).send("Error saving quiz data.");
  }
}