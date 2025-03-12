import { getQuizAnswerByUserId, updateMuValuesQuizAnswer, updateGenreLanguagePreferences } from "../models/quizAnswerModel.js";
import { findMostFrequent } from "./mathOperationsUtils.js";

export async function updateMuValues(userId, readBooks) {
    const resolvedReadBooks = await readBooks;
    const quizAnswer = await getQuizAnswerByUserId(userId);
    let genres = quizAnswer.genre_preferences;
    let languages = quizAnswer.language_preferences;
    let oldMuYear = quizAnswer.mu_year;
    let oldMuPages = quizAnswer.mu_pages;
    const learningRate = 0.5;

    let sumOfYears = 0;
    let sumOfPages = 0;
    for(let book of resolvedReadBooks) {
        sumOfYears += book.year_published;
        sumOfPages += book.number_of_pages;
    }
    let avgSavedYear = sumOfYears/resolvedReadBooks.length;
    let avgSavedPages = sumOfPages/resolvedReadBooks.length;

    let mostFrequentAddedGenre = findMostFrequent(savedBooks, 'genre_name_en');
    let genresWithoutDuplicates = [...new Set(Array(genres).concat(mostFrequentAddedGenre))];

    let mostFrequentAddedLanguage = findMostFrequent(savedBooks, 'language_en');
    let languagesWithoutDuplicates = [...new Set(Array(languages).concat(mostFrequentAddedLanguage))];

    let newMuYear = oldMuYear + learningRate * (avgSavedYear - oldMuYear);
    let newMuPages = oldMuPages + learningRate * (avgSavedPages - oldMuPages);

    await updateMuValuesQuizAnswer(userId, newMuYear, newMuPages);
    await updateGenreLanguagePreferences(userId, genresWithoutDuplicates, languagesWithoutDuplicates);
}