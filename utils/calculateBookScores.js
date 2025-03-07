import { getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore } from "../models/userBookScoreModel.js";

export async function calculateBookScores(quizAnswer, flagShortBook = false, flagOldBook = false) {
    const resolvedQuizAnswer = await quizAnswer;

    const booksByGenre = await getBooksWithGenres();
    const weights = {
        numberOfPages: resolvedQuizAnswer.number_of_pages,
        yearPublished: resolvedQuizAnswer.year_published,
        genrePreferences: resolvedQuizAnswer.genre_preferences.split(',').map(genre => genre.trim()),
        languagePreferences: resolvedQuizAnswer.language_preferences.split(',').map(genre => genre.trim()),
        genre: 0.3,
    };
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
        let genreScore = weights.genrePreferences.filter(genre => genreWords.includes(genre)).length;
        if(flagShortBook) {
            normPages = 1 - normPages;
        }
        if(flagOldBook) {
            normYear = 1 - normYear;
        }
        score = (normPages * weights.numberOfPages) + (normYear * weights.yearPublished) + (genreScore * weights.genre);
        if(!weights.languagePreferences.includes(book.language)) {
            score = 0;
        }
        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        scoredBooks.push({ ...book, score });
    }

    return scoredBooks.sort((a, b) => b.score - a.score);
}