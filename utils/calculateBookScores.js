import { getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore } from "../models/userBookScoreModel.js";
import { getUserGenresScore } from "../models/userGenresWeightsModel.js";
import { getLengthCategory, getMinMax, normalizeByPreference, getMedianLength, getYearCategory, getMedianYear, getLengthRangeFromPreference, getYearRangeFromPreference } from "../utils/mathOperationsUtils.js";

//initial book score calculation (each criteria weight = 0.25)
export async function calculateBookScores(quizAnswer, initialQuizFlag) {
    const resolvedQuizAnswer = await quizAnswer;

    let booksByGenre = await getBooksWithGenres();

    const userGenresScore = await getUserGenresScore(resolvedQuizAnswer.user_id);
    let userGenrePreferences = resolvedQuizAnswer.genre_preferences.split(',').map(genre => genre.trim());
    let eachGenreWeights = resolvedQuizAnswer.weights_genre / userGenrePreferences.length;

    let userLanguagePreferences = resolvedQuizAnswer.language_preferences.split(',').map(lang => lang.trim());
    let eachLanguageWeights = resolvedQuizAnswer.weights_language !== 0 ?  (resolvedQuizAnswer.weights_language / userLanguagePreferences.length) : 0;

    const scoredBooks = [];
    const criteria = {
        number_of_pages: resolvedQuizAnswer.preferred_length,
        year_published: resolvedQuizAnswer.preferred_year,
        genre_name_en: initialQuizFlag ? userGenrePreferences : userGenresScore.map(genre => genre.genre_name_en),
        language_en: resolvedQuizAnswer.language_preferences.trim().split(",").map(str => str.trim())
    };
    console.log(criteria);
    const userWeights = {
        number_of_pages: Number(resolvedQuizAnswer.weights_number_of_pages),
        year_published: Number(resolvedQuizAnswer.weights_year_published),
        genre_name_en: Number(resolvedQuizAnswer.weights_genre),
        language_en: Number(resolvedQuizAnswer.weights_language)
    };
    const pages = getMinMax(booksByGenre, 'number_of_pages');
    const years = getMinMax(booksByGenre, 'year_published');
    let score = 0;
    const threshold = 0.5;

    // const weights = Object.values(userWeights);
    
    // const allEqual = weights.every(weight => weight === weights[0]);

    let filteredBooks = [];

    if (initialQuizFlag) {
        filteredBooks = booksByGenre;
        // for (const book of booksByGenre) {
        //     let matches = 0;
        //     for (const key in userWeights) {
        //         const lengthCategory = await getLengthCategory(book[key]);
        //         const yearCategory = await getYearCategory(book[key]);
        //             if (Array.isArray(criteria[key])) {
        //                 console.log("Book ", book.title_en, " has key ", book[key]);
        //                 console.log("Includes ", criteria[key]);
        //                 console.log("\n");
        //                 if (criteria[key].some(lang => book[key].includes(lang))) {
        //                     matches += 1;
        //                 }
        //             }
        //             else if (key === 'number_of_pages' && lengthCategory === criteria[key]) {
        //                 matches += 1;
        //             }
        //             else if (key === 'year_published' && yearCategory === criteria[key]) {
        //                 matches += 1;
        //             }
        //     }
        //     console.log("Book ", book.title_en, " has ", matches, " matches");
        //     // if (matches >= 3) filteredBooks.push(book);
        //     // else await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        // }
    } else {
        for (const book of booksByGenre) {
            let needsToBeExcluded = false;

            for (const key in userWeights) {
                if (userWeights[key] >= threshold) {
                    const lengthCategory = await getLengthCategory(book[key]);
                    const yearCategory = await getYearCategory(book[key]);
                    if (Array.isArray(criteria[key])) {
                        if (!criteria[key].some(lang => book[key].includes(lang))) {
                            await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
                            needsToBeExcluded = true;
                            break;
                        }
                    }
                    else if (key === 'number_of_pages' && lengthCategory !== criteria[key]) {
                        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
                        needsToBeExcluded = true;
                        break;
                    }
                    else if (key === 'year_published' && yearCategory !== criteria[key]) {
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
    
    for (let book of booksByGenre) {
        let genreWords = book.genre_name_en.split(',').map(word => word.trim());
        // if (getLengthCategory(book.number_of_pages) === resolvedQuizAnswer.preferred_length &&
        //      getYearCategory(book.year_published) === resolvedQuizAnswer.preferred_year ){
            // && userGenrePreferences.includes(genreWords)) {
        const lengthValue = await getMedianLength(resolvedQuizAnswer.preferred_length);
        const [minLength, maxLength] = await getLengthRangeFromPreference(resolvedQuizAnswer.preferred_length);
        const yearValue = await getMedianYear(resolvedQuizAnswer.preferred_year);
        const [minYear, maxYear] = await getYearRangeFromPreference(resolvedQuizAnswer.preferred_year);

        // let normPages = normalizeData(book.number_of_pages, resolvedQuizAnswer.preferred_length, pages.min, lengthValue, pages.max);
        // let normYear = normalizeData(book.year_published, resolvedQuizAnswer.preferred_year, years.min, yearValue, years.max);
        // let normPages = normalizeUsingMedian(booksByGenre, book.number_of_pages, lengthValue, 'number_of_pages', resolvedQuizAnswer.preferred_length);
        // let normYear = normalizeUsingMedian(booksByGenre, book.year_published, yearValue, 'year_published', resolvedQuizAnswer.preferred_year);
        
        let normPages = normalizeByPreference(book.number_of_pages, resolvedQuizAnswer.preferred_length, pages.min, pages.max, minLength, maxLength, lengthValue);
        let normYear = normalizeByPreference(book.year_published, resolvedQuizAnswer.preferred_year, years.min, years.max, minYear, maxYear, yearValue);

        let languageWords = book.language_en.split(',').map(word => word.trim());
        let numOfMatchingLanguages = userLanguagePreferences.filter(genre => languageWords.includes(genre)).length;
        let results = [];
        let totalGenreWeight = 0;
        if (!initialQuizFlag) {
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

            let numOfMatchingGenres = criteria.genre_name_en.filter(genre => genreWords.includes(genre)).length
            totalGenreWeight = eachGenreWeights * numOfMatchingGenres;
        }
       
        score = (normPages * userWeights.number_of_pages) + (normYear * userWeights.year_published) + totalGenreWeight + (numOfMatchingLanguages * eachLanguageWeights);
        console.log(book.title_en, " has ", score);
        console.log("Pages: ", normPages);
        console.log("Year: ", normYear);
        console.log("Genre: ", totalGenreWeight);
        console.log("Lang: ", eachLanguageWeights);
        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        scoredBooks.push({ ...book, score });
    }
    
    return scoredBooks.sort((a, b) => b.score - a.score);
}