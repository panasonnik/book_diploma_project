import { getBooks, getBooksByGenre } from "../models/bookModel.js";
import { addBookScore, bookScoreExists, updateBookScore } from "../models/userBookScoreModel.js";
import { updateBookScores } from "../utils/updateBookScores.js";

export async function calculateBookScores(quizAnswer, isRecursive = false) {
    const resolvedQuizAnswer = await quizAnswer;
    console.log(resolvedQuizAnswer);

    const booksByGenre = await getBooksByGenre();
    const weights = {
        numberOfPages: resolvedQuizAnswer.number_of_pages,
        yearPublished: resolvedQuizAnswer.year_published,
        genrePreferences: resolvedQuizAnswer.genre_preferences.split(',').map(genre => genre.trim()),
        genre: 0.5,
    };

    const scoredBooks = [];

    for (let [genre, books] of Object.entries(booksByGenre)) {
        const minPages = Math.min(...books.map(book => book.number_of_pages));
        const maxPages = Math.max(...books.map(book => book.number_of_pages));
        const minYear = Math.min(...books.map(book => book.year_published));
        const maxYear = Math.max(...books.map(book => book.year_published));

        for (let book of books) {
            const normPages = maxPages !== minPages ? (book.number_of_pages - minPages) / (maxPages - minPages) : 0;
            const normYear = maxYear !== minYear ? (book.year_published - minYear) / (maxYear - minYear) : 0;
            let genreScore = 0;
            if (weights.genrePreferences.includes(genre)) {
                genreScore += 1;
            }
            const score = (normPages * weights.numberOfPages) + (normYear * weights.yearPublished) + (genreScore * weights.genre);
            const exists = await bookScoreExists(resolvedQuizAnswer.user_id, book.book_id);

        
            await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
            
            updateBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
            
            scoredBooks.push({ ...book, score });
        }
    }

    return scoredBooks.sort((a, b) => b.score - a.score);
}
