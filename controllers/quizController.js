import { addQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { completeQuizUser } from '../models/userModel.js';
import { calculateBookScores } from '../utils/calculateBookScores.js';
import { getGenres } from '../models/genreModel.js';

export async function showQuiz(req, res) {
    try {
        const genres = await getGenres();

        console.log(genres);
        res.render('quiz', {genres});

   
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading quiz");
    }
}

export async function submitQuiz (req, res) {
    try {
        const { likert, number_of_pages, year_published, genre_preferences } = req.body;
        const userId = req.user.userId;
        console.log("likert:", likert);
        const normalizedPages = number_of_pages / 10;
        const normalizedYear = year_published / 10;
        const genrePreferencesString = Array.isArray(genre_preferences) ? genre_preferences.join(', ') : genre_preferences;
        console.log("genres:" , genrePreferencesString);
        await addQuizAnswer(userId, normalizedPages, normalizedYear, genrePreferencesString);
        await completeQuizUser(userId);
        const quizAnswer = await getQuizAnswerByUserId(userId);
        await calculateBookScores(quizAnswer);
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving quiz data.");
    }
}