import { getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore } from "../models/userBookScoreModel.js";
import { normalizeData, getMinMax } from "../utils/bookScoreUtils.js";

//initial book score calculation (each criteria weight = 0.25)
export async function calculateBookScores(quizAnswer) {
    const resolvedQuizAnswer = await quizAnswer;
    console.log(resolvedQuizAnswer);
    const booksByGenre = await getBooksWithGenres();

    let userGenrePreferences = resolvedQuizAnswer.genre_preferences
    .split(',')
    .map(genre => genre.trim());
    let eachGenreWeights = resolvedQuizAnswer.weights_genre / userGenrePreferences.length;

    let userLanguagePreferences = resolvedQuizAnswer.language_preferences
    .split(',')
    .map(genre => genre.trim());
    let eachLanguageWeights = resolvedQuizAnswer.weights_language / userLanguagePreferences.length;

    const scoredBooks = [];
    const minMaxPages = getMinMax(booksByGenre, 'number_of_pages');
    const minMaxYear = getMinMax(booksByGenre, 'year_published');
    let score = 0;
    for (let book of booksByGenre) {
        let normPages = normalizeData(book.number_of_pages, resolvedQuizAnswer.mu_pages,minMaxPages.max, minMaxPages.min);
        let normYear = normalizeData(book.year_published, resolvedQuizAnswer.mu_year,minMaxYear.max, minMaxYear.min);

        let genreWords = book.genre_name_en.split(',').map(word => word.trim());

        let numOfMatchingGenres = userGenrePreferences.filter(genre => genreWords.includes(genre)).length;
        let languageWords = book.language_en.split(',').map(word => word.trim());
        let numOfMatchingLanguages = userLanguagePreferences.filter(genre => languageWords.includes(genre)).length;
        score = (normPages * resolvedQuizAnswer.weights_number_of_pages) + (normYear * resolvedQuizAnswer.weights_year_published) + (numOfMatchingGenres * eachGenreWeights) + (numOfMatchingLanguages * eachLanguageWeights);
        // if(!weights.languagePreferences.includes(book.language)) {
        //     score = 0;
        // }
        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        scoredBooks.push({ ...book, score });
    }

    return scoredBooks.sort((a, b) => b.score - a.score);
}