import { addQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { completeQuizUser } from '../models/userModel.js';
import { calculateBookScores } from '../utils/calculateBookScores.js';
import { getGenres } from '../models/genreModel.js';

export async function showQuiz(req, res) {
    try {
        const genres = await getGenres();
        res.render('quiz', { genres });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading quiz");
    }
}

export async function submitQuiz (req, res) {
    try {
        const { likertPages, likertYear, genre_preferences } = req.body;
        const userId = req.user.userId;
        let flagShortBook = false;
        let flagOldBook = false;
        let normalizedPages = 0;
        let normalizedYear = 0;
        if(likertPages < 0.5) {
            flagShortBook = true;
            normalizedPages = 1 - likertPages;
        } else if (likertPages == 0.5) {
            normalizedPages = 0;
        } else {
            normalizedPages = likertPages;
        }
        if(likertYear < 0.5) {
            normalizedYear = 1 - likertYear;
            flagOldBook = true;
        }
        else if (likertYear == 0.5) {
            normalizedYear = 0;
        } else {
            normalizedYear = likertYear;
        }
        const genrePreferencesString = Array.isArray(genre_preferences) ? genre_preferences.join(', ') : genre_preferences;

        await addQuizAnswer(userId, normalizedPages, normalizedYear, genrePreferencesString);
        await completeQuizUser(userId);
        const quizAnswer = await getQuizAnswerByUserId(userId);
        await calculateBookScores(quizAnswer, flagShortBook, flagOldBook);
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving quiz data.");
    }
}