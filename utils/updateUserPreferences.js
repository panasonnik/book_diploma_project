import { getBooks } from "../models/bookModel.js";
import { getGenreIdByName } from "../models/genreModel.js";
import { getQuizAnswerByUserId, updateGenreLanguagePreferences, updateCriteriaDirectionQuizAnswer } from "../models/quizAnswerModel.js";
import { getUserGenresScore, addUserGenresScore, clearUserGenresScore } from "../models/userGenresWeightsModel.js";
import { findMostFrequent, getAverage, findMedian } from "./mathOperationsUtils.js";

export async function updateGenreLanguage(userId, readBooks) {
    const resolvedReadBooks = await readBooks;
    const quizAnswer = await getQuizAnswerByUserId(userId);

    let genres = quizAnswer.genre_preferences;
    
    let languages = quizAnswer.language_preferences;
    
    let mostFrequentAddedGenre = findMostFrequent(resolvedReadBooks, 'genre_name_en');
    let genresWithoutDuplicates = [...new Set(Array(genres).concat(mostFrequentAddedGenre[0].name))];  
    
    let mostFrequentAddedLanguage = findMostFrequent(resolvedReadBooks, 'language_en');
    let languagesWithoutDuplicates = [...new Set(Array(languages).concat(mostFrequentAddedLanguage[0].name))];

    await updateGenreLanguagePreferences(userId, genresWithoutDuplicates, languagesWithoutDuplicates);
}



export async function updateCriteriaDirection (userId, readBooks) {
    const resolvedReadBooks = await readBooks;
    const books = await getBooks();
    const quizAnswer = await getQuizAnswerByUserId(userId);
    let newGoalYear = quizAnswer.goal_year;
    let newGoalPages = quizAnswer.goal_pages;
    
    const avgBookYear = getAverage(resolvedReadBooks, 'year_published');
    const allYears = books.map(book => book.year_published);
    const medianYear = findMedian(allYears);

    const avgBookPages = getAverage(resolvedReadBooks, 'number_of_pages');
    const allPages = books.map(book => book.number_of_pages);
    const medianPages = findMedian(allPages);

    if (avgBookYear > medianYear) {
        newGoalYear = 'max';
    } else {
        newGoalYear = 'min';
    }

    if (avgBookPages > medianPages) {
        newGoalPages = 'max';
    } else {
        newGoalPages = 'min';
    }
    await updateCriteriaDirectionQuizAnswer(userId, newGoalYear, newGoalPages);
}  

export async function updateGenreWeights (userId, userGenres, quizAnswer) {
    const userGenreScore = await getUserGenresScore(userId);
    const resolvedQuizAnswer = await quizAnswer;
    await clearUserGenresScore(userId);
    const weightsGenre = resolvedQuizAnswer.weights_genre;
        const genresFromDb = userGenreScore.map(item => ({
            name: item.genre_name_en,
            count: item.books_read_count
          }));
        console.log("Genre from DB: ", genresFromDb);
        let mergedGenres = mergeGenres(genresFromDb, userGenres); 
        console.log("Merged genres: ", mergedGenres);
        let newBooksReadByUser = mergedGenres.reduce((sum, item) => sum + item.count, 0);
        mergedGenres.forEach(async (genre) => {
            let genreProportion = genre.count / newBooksReadByUser;
            let genreWeightPart = weightsGenre * genreProportion;
            const genreItem = await getGenreIdByName(genre.name);
            const genreId = genreItem.genre_id;
            await addUserGenresScore(userId, genreId, genreWeightPart, genre.count);
        });
}

export async function modifyGenreWeights (userId, deletedGenre) {
    const userGenreScore = await getUserGenresScore(userId);
    const quizAnswer = await getQuizAnswerByUserId(userId);
    
    const weightsGenre = quizAnswer.weights_genre;
    const genresFromDb = userGenreScore.map(item => ({
        name: item.genre_name_en,
        count: item.genre_name_en === deletedGenre ? Math.max(0, item.books_read_count - 1) : item.books_read_count
    }));
        let newBooksReadByUser = genresFromDb.reduce((sum, item) => sum + item.count, 0);
        await clearUserGenresScore(userId);
        genresFromDb.forEach(async (genre) => {
            let genreProportion = genre.count / newBooksReadByUser;
            let genreWeightPart = weightsGenre * genreProportion;
            
            const genreItem = await getGenreIdByName(genre.name);
            const genreId = genreItem.genre_id;
            await addUserGenresScore(userId, genreId, genreWeightPart, genre.count);
        });
}

export async function distributeGenreWeights (userId) {
    const userGenreScore = await getUserGenresScore(userId);
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const weightsGenre = quizAnswer.weights_genre;
    const genresFromDb = userGenreScore.map(item => ({
        name: item.genre_name_en,
        count: item.books_read_count
    }));
        let newBooksReadByUser = genresFromDb.reduce((sum, item) => sum + item.count, 0);
        genresFromDb.forEach(async (genre) => {
            let genreProportion = genre.count / newBooksReadByUser;
            let genreWeightPart = weightsGenre * genreProportion;
            
            const genreItem = await getGenreIdByName(genre.name);
            const genreId = genreItem.genre_id;
            await addUserGenresScore(userId, genreId, genreWeightPart, genre.count);
        });
}

function mergeGenres(array1, array2) {
    let genreMap = new Map();
    [...array1, ...array2].forEach(genre => {
        if (genreMap.has(genre.name)) {
            genreMap.get(genre.name).count += genre.count;
        } else {
            genreMap.set(genre.name, { name: genre.name, count: genre.count });
        }
    });

    return Array.from(genreMap.values());
}