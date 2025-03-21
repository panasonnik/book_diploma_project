import { getSavedBooks, getReadBooks } from '../models/userModel.js';
import { getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { getTranslations } from './getTranslations.js';
import { updateCriteriaDirection, updateGenreWeights, updateGenreLanguage } from './updateUserPreferences.js';
import { calculateBookScores } from './calculateBookScores.js';
import { recalculateWeights } from "./recalculateWeights.js";

//викликаємо цю функцію для оновлення медіанного значення року та довжини книги
export async function updateBookScoresReadBooks(userId, userGenres) {
    const readBooks = await getReadBooks(userId);
    if(readBooks.length > 0) {
        //not completed!!
        await updateCriteriaDirection(userId, readBooks);
        
        //await updateGenreLanguage(userId, readBooks);
        await recalculateWeights(userId, 1.5, readBooks); // 1.5 - action intensity factor. Для прочитаних книг більше. Для просто "Обраних книг" = 0.5 (менша зміна вагів).
        
        const quizAnswer = await getQuizAnswerByUserId(userId);
        await updateGenreWeights(userId, userGenres, quizAnswer);
        await calculateBookScores(quizAnswer);
    }
    
    //res.redirect(`/${translations.lang}/home`);
}

// юзер додав у обране книги, тоді значення мю не змінюємо, а просто трішки змінюємо ваги
export async function updateBookScoresLikedBooks(req, res) {
    const userId = req.user.userId;
    const translations = getTranslations(req);
    const savedBooks = await getSavedBooks(userId);
    
    await recalculateWeights(userId, 1.0, savedBooks); // 1.5 - action intensity factor. Для прочитаних книг більше. Для просто "Обраних книг" = 0.5 (менша зміна вагів).
    const quizAnswer = await getQuizAnswerByUserId(userId);
    await calculateBookScores(quizAnswer);
    res.redirect(`/${translations.lang}/home`);
}