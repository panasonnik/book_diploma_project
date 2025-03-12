import { getSavedBooks, getReadBooks } from '../models/userModel.js';
import { getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { getTranslations } from './getTranslations.js';
import { updateMuValues } from './updateMuValues.js';
import { calculateBookScores } from './calculateBookScores.js';
import { recalculateWeights } from "./recalculateWeights.js";

//юзер прочитав кілька книг - запускаємо цю функцію для оновлення медіанного значення року та довжини книги
export async function updateBookScoresReadBooks(req, res) {
    const userId = req.user.userId;
    const translations = getTranslations(req);
    const readBooks = await getReadBooks(userId);

    await updateMuValues(userId, readBooks);
    
    await recalculateWeights(userId, 1.5, readBooks); // 1.5 - action intensity factor. Для прочитаних книг більше. Для просто "Обраних книг" = 0.5 (менша зміна вагів).
    const quizAnswer = await getQuizAnswerByUserId(userId);
    let scoredBooks = await calculateBookScores(quizAnswer);
    res.redirect(`/${translations.lang}/home`);
}

// юзер додав у обране книги, тоді значення мю не змінюємо, а просто трішки змінюємо ваги
export async function updateBookScoresLikedBooks(req, res) {
    const userId = req.user.userId;
    const translations = getTranslations(req);
    const savedBooks = await getSavedBooks(userId);
    
    await recalculateWeights(userId, 1.0, savedBooks); // 1.5 - action intensity factor. Для прочитаних книг більше. Для просто "Обраних книг" = 0.5 (менша зміна вагів).
    const quizAnswer = await getQuizAnswerByUserId(userId);
    let scoredBooks = await calculateBookScores(quizAnswer);
    res.redirect(`/${translations.lang}/home`);
}