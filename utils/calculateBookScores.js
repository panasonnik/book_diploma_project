import { getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore } from "../models/userBookScoreModel.js";

//initial book score calculation (each criteria weight = 0.25)
export async function calculateBookScores(quizAnswer) {
    const resolvedQuizAnswer = await quizAnswer;
    const booksByGenre = await getBooksWithGenres();
    let userGenrePreferences = resolvedQuizAnswer.genre_preferences.split(', ');
    let userLanguagePreferences = resolvedQuizAnswer.language_preferences.split(', ');
    const scoredBooks = [];
    const minPages = Math.min(...booksByGenre.map(book => book.number_of_pages));
    const maxPages = Math.max(...booksByGenre.map(book => book.number_of_pages));
    const minYear = Math.min(...booksByGenre.map(book => book.year_published));
    const maxYear = Math.max(...booksByGenre.map(book => book.year_published)); 
    let score = 0;
    for (let book of booksByGenre) {
        let normPages = (book.number_of_pages - minPages) / (maxPages - minPages);
        let normYear = (book.year_published - minYear) / (maxYear - minYear);
        let genreWords = book.genre_name.split(',').map(word => word.trim());

        let numOfMatchingGenres = userGenrePreferences.filter(genre => genreWords.includes(genre)).length;
        let languageWords = book.language.split(',').map(word => word.trim());
        let numOfMatchingLanguages = userLanguagePreferences.filter(genre => languageWords.includes(genre)).length;
        if(resolvedQuizAnswer.likes_short_books) {
            normPages = 1 - normPages;
        }
        if(resolvedQuizAnswer.likes_old_books) {
            normYear = 1 - normYear;
        }
        score = (normPages * resolvedQuizAnswer.weights_number_of_pages) + (normYear * resolvedQuizAnswer.weights_year_published) + (numOfMatchingGenres * resolvedQuizAnswer.weights_genre) + (numOfMatchingLanguages * resolvedQuizAnswer.weights_language);
        // if(!weights.languagePreferences.includes(book.language)) {
        //     score = 0;
        // }
        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        scoredBooks.push({ ...book, score });
    }

    return scoredBooks.sort((a, b) => b.score - a.score);
}