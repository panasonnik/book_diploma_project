import { getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore } from "../models/userBookScoreModel.js";
import { getUserGenresScore } from "../models/userGenresWeightsModel.js";
import { normalizeData, getMinMax, getLengthCategory, normalizeUsingMedian, getLengthValue, getYearCategory, getYearValue } from "../utils/mathOperationsUtils.js";

//initial book score calculation (each criteria weight = 0.25)
export async function calculateBookScores(quizAnswer) {
    const resolvedQuizAnswer = await quizAnswer;

    let booksByGenre = await getBooksWithGenres();

    const userGenresScore = await getUserGenresScore(resolvedQuizAnswer.user_id);

    let userGenrePreferences = resolvedQuizAnswer.genre_preferences.split(',').map(genre => genre.trim());
    let eachGenreWeights = resolvedQuizAnswer.weights_genre / userGenrePreferences.length;

    let userLanguagePreferences = resolvedQuizAnswer.language_preferences.split(',').map(lang => lang.trim());
    let eachLanguageWeights = resolvedQuizAnswer.weights_language / userLanguagePreferences.length;

    const scoredBooks = [];
    //const minMaxPages = getMinMax(booksByGenre, 'number_of_pages');
    //const minMaxYear = getMinMax(booksByGenre, 'year_published');

    const criteria = {
        number_of_pages: resolvedQuizAnswer.preferred_length,
        year_published: resolvedQuizAnswer.preferred_year,
        genre_name_en: resolvedQuizAnswer.genre_preferences.split(","),
        language_en: resolvedQuizAnswer.language_preferences.split(",")
    };
    const userWeights = {
        number_of_pages: Number(resolvedQuizAnswer.weights_number_of_pages),
        year_published: Number(resolvedQuizAnswer.weights_year_published),
        genre_name_en: Number(resolvedQuizAnswer.weights_genre),
        language_en: Number(resolvedQuizAnswer.weights_language)
    };
    
    let score = 0;
    const threshold = 0.4;

    const weights = Object.values(userWeights);
    
    const allEqual = weights.every(weight => weight === weights[0]);

    const filteredBooks = [];

    if (allEqual) { //if all weights are equal
        for (const book of booksByGenre) {
            let matches = 0; //if the book matches 3 out of 4 criterions
            for (const key in userWeights) {
                    if (Array.isArray(criteria[key])) {
                        if (book[key].includes(criteria[key])) {
                            matches += 1;
                        }
                    }
                    else if (key === 'number_of_pages' && getLengthCategory(book[key]) === criteria[key]) {
                        matches += 1;
                    }
                    else if (key === 'year_published' && getYearCategory(book[key]) === criteria[key]) {
                        matches += 1;
                    }
            }
            if (matches >= 3) filteredBooks.push(book);
            else await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score); //else - score for the book is 0
        }
    } else { //check if the weights are greater than threshold, to prioritize criterions
        for (const book of booksByGenre) {
            let needsToBeExcluded = false;

            for (const key in userWeights) {
                if (userWeights[key] >= threshold) {
                    if (Array.isArray(criteria[key])) {
                        if (!criteria[key].includes(book[key])) {
                            await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
                            needsToBeExcluded = true;
                            break;
                        }
                    }
                    else if (key === 'number_of_pages' && getLengthCategory(book[key]) !== criteria[key]) {
                        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
                        needsToBeExcluded = true;
                        break;
                    }
                    else if (key === 'year_published' && getYearCategory(book[key]) !== criteria[key]) {
                        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
                        needsToBeExcluded = true;
                        break;
                    }
                }
            }

            if (!needsToBeExcluded) filteredBooks.push(book);
        }
    }
    booksByGenre = filteredBooks;
    // if(userWeights.number_of_pages > threshold) {
    //     booksByGenre = booksByGenre.filter(book => {
    //             return getLengthCategory(book.number_of_pages) === resolvedQuizAnswer.preferred_length
    //     });
    // }
    
    for (let book of booksByGenre) {
        let genreWords = book.genre_name_en.split(',').map(word => word.trim());
        // if (getLengthCategory(book.number_of_pages) === resolvedQuizAnswer.preferred_length &&
        //      getYearCategory(book.year_published) === resolvedQuizAnswer.preferred_year ){
            // && userGenrePreferences.includes(genreWords)) {
        let normPages = normalizeUsingMedian(booksByGenre, book.number_of_pages, getLengthValue(resolvedQuizAnswer.preferred_length), 'number_of_pages');
        let normYear = normalizeUsingMedian(booksByGenre, book.year_published, getYearValue(resolvedQuizAnswer.preferred_year), 'year_published');

        let languageWords = book.language_en.split(',').map(word => word.trim());
        let numOfMatchingLanguages = userLanguagePreferences.filter(genre => languageWords.includes(genre)).length;
        let results = [];
        let totalGenreWeight = 0;
        if (userGenresScore.length > 0) {
            userGenrePreferences.forEach(userGenre => {
                const genre = userGenresScore.find(g => g.genre_name_en === userGenre);
                if (genre) {
                    let calculatedWeight = genre.weight;
                    results.push({ genre: userGenre, weight: calculatedWeight });
                }
            });
            
    
            genreWords.forEach(genre => {
                const matchingGenre = results.find(result => result.genre === genre);
    
                if (matchingGenre) {
                    totalGenreWeight += parseFloat(matchingGenre.weight);
                }
            });
        } else {
            let genreWords = book.genre_name_en.split(',').map(word => word.trim());
            let numOfMatchingGenres = userGenrePreferences.filter(genre => genreWords.includes(genre)).length;
            totalGenreWeight = eachGenreWeights * numOfMatchingGenres;
        }
       
        //let numOfMatchingGenres = userGenrePreferences.filter(genre => genreWords.includes(genre)).length;
        
        score = (normPages * resolvedQuizAnswer.weights_number_of_pages) + (normYear * resolvedQuizAnswer.weights_year_published) + totalGenreWeight + (numOfMatchingLanguages * eachLanguageWeights);
        // if(!weights.languagePreferences.includes(book.language)) {
        //     score = 0;
        // }
        // await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        // scoredBooks.push({ ...book, score });
    // } else {
    //     score = 0;
    // }
    await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        scoredBooks.push({ ...book, score });
    }
    
    return scoredBooks.sort((a, b) => b.score - a.score);
}