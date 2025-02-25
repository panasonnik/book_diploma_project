import { addQuizAnswer } from "../models/quizAnswersModel.js";
import { completeQuizUser } from '../models/userModel.js';

export async function showQuiz(req, res) {
    try {
        res.render('quiz');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading quiz");
    }
}

export async function submitQuiz (req, res) {
    try {
        const { number_of_pages, year_published, genre_preferences } = req.body;
        const userId = req.user.userId;
        const normalizedPages = number_of_pages / 10;
        const normalizedYear = year_published / 10;
        const genrePreferencesString = Array.isArray(genre_preferences) ? genre_preferences.join(', ') : genre_preferences;

        addQuizAnswer(userId, normalizedPages, normalizedYear, genrePreferencesString);
        completeQuizUser(userId);
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving quiz data.");
    }
}