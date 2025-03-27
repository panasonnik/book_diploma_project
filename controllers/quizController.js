import { addQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { completeQuizUser } from '../models/userModel.js';
import { calculateBookScores } from '../utils/calculateBookScores.js';
import { getGenres, getGenreIdByName } from '../models/genreModel.js';
import { getLanguages } from '../models/bookModel.js';
import { getTranslations } from '../utils/getTranslations.js';
import { addUserGenresScore } from '../models/userGenresWeightsModel.js';
import { topsis } from '../utils/topsis.js';
import { promethee } from '../utils/promethee.js';
import { normalize } from "../utils/mathOperationsUtils.js";

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

        await addQuizAnswer(userId, bookLengthWeights, bookYearWeights, genreWeights, languageWeights, genrePreferencesArray, languagePreferencesArray, goalYear, goalPages);
        

        req.user = await completeQuizUser(userId);
        const quizAnswer = await getQuizAnswerByUserId(userId);
        await calculateBookScores(quizAnswer);
        await topsis(quizAnswer);
        console.log("PROMETHEE\n\n");
        await promethee(quizAnswer);
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
      res.render('quiz-reevaluation', { translations, genres, languages });
  } catch (err) {
      console.error(err);
      res.status(500).send("Error loading quiz");
  }
}

export async function submitRetakeQuiz (req, res) {
  try {
      const { bookLengthWeights, bookYearWeights, genreWeights, languageWeights, bookLength, bookYear, genre_preferences, language_preferences } = req.body;
      console.log(req.body);
      const translations = getTranslations(req);
      const userId = req.user.userId;
      const sumOfUserWeights = bookLengthWeights + bookYearWeights + genreWeights + languageWeights;
      const weights = {
        year: normalize(bookYearWeights, sumOfUserWeights),
        pages: normalize(bookLengthWeights, sumOfUserWeights),
        genres: normalize(genreWeights, sumOfUserWeights),
        languages: normalize(languageWeights, sumOfUserWeights)
      };

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

      const genreIds = await Promise.all(genrePreferencesArray.map(async (element) => {
          const genreId = await getGenreIdByName(element);
          await addUserGenresScore(userId, genreId.genre_id, weights.genres/genrePreferencesArray.length, 1);
      }));

      await addQuizAnswer(userId, weights.pages, weights.year, weights.genres, weights.languages, genrePreferencesArray, languagePreferencesArray, goalYear, goalPages);
      
      const quizAnswer = await getQuizAnswerByUserId(userId);
      await calculateBookScores(quizAnswer);
      await topsis(quizAnswer);
      console.log("PROMETHEE\n\n");
      await promethee(quizAnswer);
      res.redirect(`/${translations.lang}/home`);
  } catch (error) {
      console.error(error);
      res.status(500).send("Error saving quiz data.");
  }
}