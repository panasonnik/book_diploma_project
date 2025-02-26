import { getBookById, getBooks, getBooksByGenre } from "../models/bookModel.js";
import { getQuizAnswerByUserId, updateQuizAnswers } from "../models/quizAnswerModel.js";
import { getBookScore, getUserBookScores, updateBookScore } from "../models/userBookScoreModel.js";
import { calculateBookScores } from "../utils/calculateBookScores.js";

export async function updateBookScores(userId, bookId) {
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const savedBook = await getBookById(bookId);
    const bookScore = await getBookScore(userId, bookId);
    if (bookScore.book_score < 0.5) {
        const scoredBooks = await getUserBookScores(userId);
        const highestScoredBook = scoredBooks.sort((a, b) => b.score - a.score)[0];
        const updatedQuizAnswers = adjustQuizAnswers(quizAnswer, savedBook, highestScoredBook);
        await updateQuizAnswers(userId, updatedQuizAnswers);
        await calculateBookScores(updatedQuizAnswers);
            
    }
}

function adjustQuizAnswers(quizAnswer, savedBook, highestScoredBook) {
    let updatedQuizAnswer = { ...quizAnswer };

    Object.keys(quizAnswer).forEach((key) => {
        if (typeof quizAnswer[key] === "number") {
            let difference = highestScoredBook[key] - savedBook[key];
            
            if (difference > 0) {
                updatedQuizAnswer[key] = quizAnswer[key] + 0.1;
            } else {
                updatedQuizAnswer[key] = Math.max(quizAnswer[key] - 0.1, 0);
            }
        }
    });
    

    return updatedQuizAnswer;
}
