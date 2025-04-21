import { getSavedBooks } from '../models/userModel.js';
import { getUserReadBooks } from '../models/userBooksModel.js';
import { getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { getTranslations } from './getTranslations.js';
import { calculateBookScores } from './calculateBookScores.js';
import { recalculateWeights } from "./recalculateWeights.js";

export async function updateBookScoresReadBooks(userId) {
    const readBooks = await getUserReadBooks(userId);
    if(readBooks.length > 0) {
        let isLikedBooksPassedOn = false;
        await recalculateWeights(userId, 2.0, readBooks, isLikedBooksPassedOn); // 2.0 - action intensity factor. Для прочитаних книг більше. Для просто "Обраних книг" = 1.5 (менша зміна вагів).
        
        const quizAnswer = await getQuizAnswerByUserId(userId);
        await calculateBookScores(quizAnswer);
    }
}

// юзер додав у обране книги, тоді просто трішки змінюємо ваги
export async function updateBookScoresLikedBooks(req, res) {
    const userId = req.user.userId;
    let isLikedBooksPassedOn = true;
    const translations = getTranslations(req);
    const savedBooks = await getSavedBooks(userId);
    
    await recalculateWeights(userId, 1.5, savedBooks, isLikedBooksPassedOn);
    const quizAnswer = await getQuizAnswerByUserId(userId);
    await calculateBookScores(quizAnswer);
    res.redirect(`/${translations.lang}/home`);
}