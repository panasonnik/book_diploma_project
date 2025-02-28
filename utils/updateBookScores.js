import { getBookById, getBooks, getBooksByGenre } from "../models/bookModel.js";
import { getBookGenre } from "../models/genreModel.js";
import { getQuizAnswerByUserId, updateQuizAnswers } from "../models/quizAnswerModel.js";
import { getBookScore, getUserBookScores, updateBookScore } from "../models/userBookScoreModel.js";
import { calculateBookScores } from "../utils/calculateBookScores.js";

export async function updateBookScores(userId, bookId) {
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const savedBook = await getBookById(bookId);
    const bookScore = await getBookScore(userId, bookId);
    let pages = quizAnswer.number_of_pages;
    let year = quizAnswer.year_published;
    let genres = [];
    let genrePreferences = quizAnswer.genre_preferences;
    let flagShortBook = false;
    let flagOldBook = false;
    if (bookScore.book_score < 1.0) {
        const scoredBooks = await getUserBookScores(userId);
        const highestScoredBook = scoredBooks.sort((a, b) => b.score - a.score)[0];
        const savedBookGenre = await getBookGenre(savedBook.book_id);
        
        let savedGenres = savedBookGenre.map(g => g.genre_name).join(', ').split(', ').map(g => g.trim());

        genres = savedGenres.filter(genre => !genrePreferences.includes(genre));
        if (highestScoredBook.number_of_pages > savedBook.number_of_pages) {
            pages = Math.min(quizAnswer.number_of_pages + 0.3, 1);
            
        } else {
            pages = Math.max(quizAnswer.number_of_pages - 0.3, quizAnswer.number_of_pages * 0.75);
            flagShortBook = true;
        }

        if (highestScoredBook.year_published > savedBook.year_published) {
            year = Math.min(quizAnswer.year_published + 0.3, 1);
            flagOldBook = true;
        } else {
            year = Math.max(quizAnswer.year_published - 0.3, quizAnswer.year_published * 0.75);
        }
        await updateQuizAnswers(userId, pages, year, genres.concat(genrePreferences).join(', '));
            const updatedQuizAnswers = await getQuizAnswerByUserId(userId);
            calculateBookScores(updatedQuizAnswers, flagShortBook, flagOldBook);
        
    }
}
