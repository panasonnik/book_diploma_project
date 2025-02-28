import { getBooks, getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore, bookScoreExists, updateBookScore } from "../models/userBookScoreModel.js";

export async function calculateBookScores(quizAnswer) {
    const resolvedQuizAnswer = await quizAnswer;

    const booksByGenre = await getBooksWithGenres();
    const weights = {
        numberOfPages: resolvedQuizAnswer.number_of_pages,
        yearPublished: resolvedQuizAnswer.year_published,
        genrePreferences: resolvedQuizAnswer.genre_preferences.split(',').map(genre => genre.trim()),
        genre: 0.5,
    };
    const scoredBooks = [];
    const minPages = Math.min(...booksByGenre.map(book => book.number_of_pages));
    const maxPages = Math.max(...booksByGenre.map(book => book.number_of_pages));
    const minYear = Math.min(...booksByGenre.map(book => book.year_published));
    const maxYear = Math.max(...booksByGenre.map(book => book.year_published));
    for (let book of booksByGenre) {
        const normPages = (book.number_of_pages - minPages) / (maxPages - minPages);
        const normYear = (book.year_published - minYear) / (maxYear - minYear);
        let genreWords = book.genre_name.split(',').map(word => word.trim());
        let genreScore = weights.genrePreferences.filter(genre => genreWords.includes(genre)).length;
        const score = (normPages * weights.numberOfPages) + (normYear * weights.yearPublished) + (genreScore * weights.genre);
        
        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        scoredBooks.push({ ...book, score });
        
    }

    return scoredBooks.sort((a, b) => b.score - a.score);
}