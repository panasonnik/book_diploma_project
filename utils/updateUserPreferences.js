import { getGenreIdByName } from "../models/genreModel.js";
import { getQuizAnswerByUserId, updateGenreLanguagePreferences, updateCriteriaDirectionQuizAnswer } from "../models/quizAnswerModel.js";
import { getUserGenresScore, addUserGenresScore } from "../models/userGenresWeightsModel.js";
import { findMostFrequent } from "./mathOperationsUtils.js";

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
    const quizAnswer = await getQuizAnswerByUserId(userId);
    //implement logic
    let newGoalYear = 'max';
    let newGoalPages = 'min';


    await updateCriteriaDirectionQuizAnswer(userId, newGoalYear, newGoalPages);
}

export async function updateGenreWeights (userId, userGenres, quizAnswer) {
    const userGenreScore = await getUserGenresScore(userId);
    const resolvedQuizAnswer = await quizAnswer;
    const weightsGenre = resolvedQuizAnswer.weights_genre;
        const genresFromDb = userGenreScore.map(item => ({
            name: item.genre_name_en,
            count: item.books_read_count
          }));
        let mergedGenres = mergeGenres(genresFromDb, userGenres); 
        let newBooksReadByUser = mergedGenres.reduce((sum, item) => sum + item.count, 0);
        mergedGenres.forEach(async (genre) => {
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