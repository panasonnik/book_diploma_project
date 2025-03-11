import { updateMuValuesQuizAnswer } from "../models/quizAnswerModel.js";

export async function updateMuValues(userId, savedBooks) {
    const resolvedSavedBooks = await savedBooks;
    let sumOfYears = 0;
    let sumOfPages = 0;
    for(let book of resolvedSavedBooks) {
        sumOfYears += book.year_published;
        sumOfPages += book.number_of_pages;
    }
    let avgSavedYear = sumOfYears/resolvedSavedBooks.length;
    let avgSavedPages = sumOfPages/resolvedSavedBooks.length;
    await updateMuValuesQuizAnswer(userId, avgSavedYear, avgSavedPages);
}