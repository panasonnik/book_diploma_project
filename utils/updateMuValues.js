import { getQuizAnswerByUserId, updateMuValuesQuizAnswer, updateGenreLanguagePreferences } from "../models/quizAnswerModel.js";
import { findMostFrequent } from "../utils/bookScoreUtils.js";

export async function updateMuValues(userId, savedBooks) {
    const resolvedSavedBooks = await savedBooks;
    const quizAnswer = await getQuizAnswerByUserId(userId);
    let genres = quizAnswer.genre_preferences;
    let languages = quizAnswer.language_preferences;

    let sumOfYears = 0;
    let sumOfPages = 0;
    for(let book of resolvedSavedBooks) {
        sumOfYears += book.year_published;
        sumOfPages += book.number_of_pages;
    }
    let avgSavedYear = sumOfYears/resolvedSavedBooks.length;
    let avgSavedPages = sumOfPages/resolvedSavedBooks.length;

    let mostFrequentAddedGenre = findMostFrequent(savedBooks, 'genre_name_en');
    let genresWithoutDuplicates = [...new Set(Array(genres).concat(mostFrequentAddedGenre))];

    let mostFrequentAddedLanguage = findMostFrequent(savedBooks, 'language_en');
    let languagesWithoutDuplicates = [...new Set(Array(languages).concat(mostFrequentAddedLanguage))];

    await updateMuValuesQuizAnswer(userId, avgSavedYear, avgSavedPages);
    await updateGenreLanguagePreferences(userId, genresWithoutDuplicates, languagesWithoutDuplicates);
}