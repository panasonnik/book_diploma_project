import { getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore } from "../models/userBookScoreModel.js";
import { getUserGenresScore, getUserGenresWeights } from "../models/userGenresWeightsModel.js";
import { getUserReadBooks } from '../models/userBooksModel.js';
import { getLengthCategory, getMinMax, normalizeByPreference, getMedianLength, getYearCategory, getMedianYear, getLengthRangeFromPreference, getYearRangeFromPreference } from "../utils/mathOperationsUtils.js";

//initial book score calculation (each criteria weight = 0.25)
export async function calculateBookScores(quizAnswer, initialQuizFlag) {
    const resolvedQuizAnswer = await quizAnswer;

    let booksByGenre = await getBooksWithGenres();

    const userGenresScore = await getUserGenresScore(resolvedQuizAnswer.user_id);
    const userGenresWeights = await getUserGenresWeights(resolvedQuizAnswer.user_id);
    let userGenrePreferences = resolvedQuizAnswer.genre_preferences.split(',').map(genre => genre.trim());
    let eachGenreWeights = resolvedQuizAnswer.weights_genre / userGenrePreferences.length;
    let userReadBooks = await getUserReadBooks(resolvedQuizAnswer.user_id);
    let userLanguagePreferences = resolvedQuizAnswer.language_preferences.split(',').map(lang => lang.trim());
    let eachLanguageWeights = resolvedQuizAnswer.weights_language !== 0 ? (resolvedQuizAnswer.weights_language / userLanguagePreferences.length) : 0;

    const scoredBooks = [];
    const criteria = {
        number_of_pages: resolvedQuizAnswer.preferred_length,
        year_published: resolvedQuizAnswer.preferred_year,
        genre_name_en: initialQuizFlag ? userGenresWeights.map(genre => genre.genre_name_en) : userGenresScore.map(genre => genre.genre_name_en),
        language_en: userLanguagePreferences
    };
    const userWeights = {
        number_of_pages: Number(resolvedQuizAnswer.weights_number_of_pages),
        year_published: Number(resolvedQuizAnswer.weights_year_published),
        genre_name_en: Number(resolvedQuizAnswer.weights_genre),
        language_en: Number(resolvedQuizAnswer.weights_language)
    };
    const pages = getMinMax(booksByGenre, 'number_of_pages');
    const years = getMinMax(booksByGenre, 'year_published');

    let filteredBooks = [];
    if(userReadBooks.length > 0) {
        const booksToExclude = userReadBooks.filter(book => book.read_progress > 0.7);
        const excludeIds = new Set(booksToExclude.map(book => book.book_id));
        booksByGenre = booksByGenre.filter(book => !excludeIds.has(book.book_id));
    }
    const threshold = 0.3;

    if (initialQuizFlag) {
        for (const book of booksByGenre) {
            let matches = 0;
            for (const key in userWeights) {
                const lengthCategory = await getLengthCategory(book[key]);
                const yearCategory = await getYearCategory(book[key]);

                if (Array.isArray(criteria[key])) {
                    if (criteria[key].some(lang => book[key].includes(lang))) {
                        matches += 1;
                    }
                } else if (key === 'number_of_pages' && lengthCategory === criteria[key]) {
                    matches += 1;
                } else if (key === 'year_published' && yearCategory === criteria[key]) {
                    matches += 1;
                }
            }
            if (matches === 4) filteredBooks.push(book);
            else await addBookScore(resolvedQuizAnswer.user_id, book.book_id, 0);
        }
        if (filteredBooks.length == 0) {
            for (const book of booksByGenre) {
            let matches = 0;
            for (const key in userWeights) {
                const lengthCategory = await getLengthCategory(book[key]);
                const yearCategory = await getYearCategory(book[key]);

                if (Array.isArray(criteria[key])) {
                    if (criteria[key].some(lang => book[key].includes(lang))) {
                        matches += 1;
                    }
                } else if (key === 'number_of_pages' && lengthCategory === criteria[key]) {
                    matches += 1;
                } else if (key === 'year_published' && yearCategory === criteria[key]) {
                    matches += 1;
                }
            }
            if (matches >= 3) filteredBooks.push(book);
            else await addBookScore(resolvedQuizAnswer.user_id, book.book_id, 0);
        }

    }
        
    } else {
    filteredBooks = [];

    for (const book of booksByGenre) {
        let excludeBook = false;

        for (const key in userWeights) {
            if (userWeights[key] >= threshold) {
                const lengthCategory = await getLengthCategory(book[key]);
                const yearCategory = await getYearCategory(book[key]);

                if (Array.isArray(criteria[key])) {
                    if (!criteria[key].some(lang => book[key].includes(lang))) {
                        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, 0);
                        excludeBook = true;
                        break; 
                    }
                } else if (key === 'number_of_pages' && lengthCategory !== criteria[key]) {
                    await addBookScore(resolvedQuizAnswer.user_id, book.book_id, 0);
                    excludeBook = true;
                    break;
                } else if (key === 'year_published' && yearCategory !== criteria[key]) {
                    await addBookScore(resolvedQuizAnswer.user_id, book.book_id, 0);
                    excludeBook = true;
                    break;
                }
            }
        }

        if (!excludeBook) {
            filteredBooks.push(book);
        }
    }




    }
    for (const book of filteredBooks) {
        const genreWords = book.genre_name_en.split(',').map(word => word.trim());

        const [minLength, maxLength] = await getLengthRangeFromPreference(resolvedQuizAnswer.preferred_length);
        const [minYear, maxYear] = await getYearRangeFromPreference(resolvedQuizAnswer.preferred_year);

        const normPages = normalizeByPreference(book.number_of_pages, pages.min, pages.max, minLength, maxLength);
        const normYear = normalizeByPreference(book.year_published, years.min, years.max, minYear, maxYear);

        const languageWords = book.language_en.split(',').map(word => word.trim());
        const numOfMatchingLanguages = userLanguagePreferences.filter(lang => languageWords.includes(lang)).length;

        let totalGenreWeight = 0;

        if (!initialQuizFlag) {
            let results = [];
            userGenrePreferences.forEach(userGenre => {
                const genre = userGenresScore.find(g => g.genre_name_en === userGenre);
                if (genre) results.push({ genre: userGenre, weight: genre.weight });
            });
            genreWords.forEach(genre => {
                const matchingGenre = results.find(result => result.genre === genre);
                if (matchingGenre) totalGenreWeight += parseFloat(matchingGenre.weight);
            });
        } else {
            const numOfMatchingGenres = criteria.genre_name_en.filter(genre => genreWords.includes(genre)).length;
            totalGenreWeight = eachGenreWeights * numOfMatchingGenres;
        }

        const score = (normPages * userWeights.number_of_pages) + (normYear * userWeights.year_published) + totalGenreWeight + (numOfMatchingLanguages * eachLanguageWeights);

        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        console.log(book.title_en);
        console.log(score);
        scoredBooks.push({ ...book, score });
    }

    return scoredBooks.sort((a, b) => b.score - a.score);
}
