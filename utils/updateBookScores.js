import { getSavedBooks } from '../models/userModel.js';
import { getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { getTranslations } from './getTranslations.js';
import { updateMuValues } from './updateMuValues.js';
import { calculateBookScores } from './calculateBookScores.js';

export async function updateBookScores(req, res) {
    const userId = req.user.userId;
    const translations = getTranslations(req);
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const savedBooks = await getSavedBooks(userId);
    await updateMuValues(userId, savedBooks);
    let scoredBooks = await calculateBookScores(quizAnswer);
    console.log(scoredBooks);
    res.redirect(`/${translations.lang}/home`);
}