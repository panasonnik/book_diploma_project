import { getBooks } from "../models/bookModel.js";
import { addBookScore } from "../models/usersBooksModel.js";

export async function calculateBookScores(quizAnswer) {
    const resolvedQuizAnswer = await quizAnswer;
    const books = await getBooks();

    const weights = {
        numberOfPages: resolvedQuizAnswer.number_of_pages,
        yearPublished: resolvedQuizAnswer.year_published,
        genrePreferences: resolvedQuizAnswer.genre_preferences
    };

    console.log(weights);
    console.log(books);

    const minPages = Math.min(...books.map(book => book.number_of_pages));
    const maxPages = Math.max(...books.map(book => book.number_of_pages));
    const minYear = Math.min(...books.map(book => book.year_published));
    const maxYear = Math.max(...books.map(book => book.year_published));

    const scoredBooks = [];
    for (let book of books) {
        const normPages = (book.number_of_pages - minPages) / (maxPages - minPages);
        const normYear = (book.year_published - minYear) / (maxYear - minYear);
        const score = (normPages * weights.numberOfPages) + (normYear * weights.yearPublished);

        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);

        scoredBooks.push({ ...book, score });
    }

    return scoredBooks.sort((a, b) => b.score - a.score);
}
