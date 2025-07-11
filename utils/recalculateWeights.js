import { normalize, getLengthCategory, getYearCategory } from "../utils/mathOperationsUtils.js";
import { updateQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { getUserGenresScore, clearUserGenresScore, addUserGenresScore, getUserGenresWeights } from "../models/userGenresWeightsModel.js";
import { getUserBooksWithLanguage } from "../models/userBooksModel.js";
import { getLanguageCount } from "../models/bookModel.js";
import { getTopTwoByReadCount, mergeGenres } from "./userBookReadUtils.js";

export async function recalculateWeights(userId, actionIntensityFactor, books, isLikedBooksPassedOn) {
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const userGenresScore = await getUserGenresScore(userId);
    const userGenresWeights = await getUserGenresWeights(userId);

    let mergedGenres = mergeGenres(userGenresScore, userGenresWeights);

    const savedBooks = await books;
    const booksWithLanguage = await getUserBooksWithLanguage(userId);
    const languageCount = await getLanguageCount();

    const pagesPreference = quizAnswer.preferred_length;
    const yearPreference = quizAnswer.preferred_year;
    const signal = 0.2; //constant to change weights slightly when user liked books

    // let genres = quizAnswer.genre_preferences;
    // genres = genres.split(', ').map(genre => genre.trim());
    const oldGenresWeight = Number(quizAnswer.weights_genre);
    const oldLanguagesWeight = Number(quizAnswer.weights_language);
    const oldPagesWeight = Number(quizAnswer.weights_number_of_pages);
    const oldYearWeight = Number(quizAnswer.weights_year_published);

    let languages = quizAnswer.language_preferences;
    //let genres = quizAnswer.genre_preferences;

    const learningRate = 0.4;

    let newGenresWeight = oldGenresWeight;
    let newLanguagesWeight = oldLanguagesWeight;
    let newNumberOfPagesWeight = oldPagesWeight;
    let newYearWeight = oldYearWeight;

    let genreCounts = {};
    let languageCounts = {};
    
    for (let book of savedBooks) {
        let genres = book.genre_name_en.split(',').map(genre => genre.trim());
        let languages = book.language_en.split(',').map(lang => lang.trim());
        for (let genre of genres) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
        for (let lang of languages) {
            languageCounts[lang] = (languageCounts[lang] || 0) + 1;
        }
    }
    
    let newWeightForSingleGenre = {};
    let newWeightForSingleLanguage = {};
    if(!isLikedBooksPassedOn) {
        for (const genre of mergedGenres) {
            newWeightForSingleGenre[genre.genre_name_en.split(",")] = Number(genre.weight) + learningRate * actionIntensityFactor * (genre.books_read_count * genre.avg_read_progress - Number(genre.weight));
            //await addUserGenresScore(userId, genre.genre_id, genreWeightPart, genre.books_read_count);
        }
        for (const lang of booksWithLanguage) {
            newWeightForSingleLanguage[lang.language_en.split(",")] = oldLanguagesWeight/languageCount + learningRate * actionIntensityFactor * (lang.books_read_count * lang.avg_read_progress - oldLanguagesWeight/languageCount);
        }
        newGenresWeight = Object.values(newWeightForSingleGenre).reduce((sum, count) => sum + count, 0); //not normalized
        newLanguagesWeight = Object.values(newWeightForSingleLanguage).reduce((sum, count) => sum + count, 0); //not normalized
    }

    if(isLikedBooksPassedOn) {
        newNumberOfPagesWeight += learningRate * actionIntensityFactor * (signal - oldPagesWeight);
        newYearWeight += learningRate * actionIntensityFactor * (signal - oldYearWeight);
        newGenresWeight += learningRate * actionIntensityFactor * (signal - oldGenresWeight);
        newLanguagesWeight += learningRate * actionIntensityFactor * (signal - oldLanguagesWeight);
    } else {
        let readBooksScore = 0;
        let totalScore = 0;
        let engagementRatio = 0;
        //if we're dealing with read books, calculate new weights based on reading progress

            for (const book of savedBooks) {
              const bookLengthCategory = await getLengthCategory(book.number_of_pages);
              if(bookLengthCategory == pagesPreference) {
                readBooksScore += Number(book.read_progress); //if book is in desired range
              }
              totalScore += Number(book.read_progress); //total
            }
        
        engagementRatio = readBooksScore / totalScore;
        newNumberOfPagesWeight = oldPagesWeight + learningRate * actionIntensityFactor * (engagementRatio - oldPagesWeight); //not normalized

        readBooksScore = 0;
        totalScore = 0;

            for (const book of savedBooks) {
              const bookYearCategory = await getYearCategory(book.year_published);
              if(bookYearCategory == yearPreference) {
                readBooksScore += book.read_progress; //if book is in desired range
              }
              totalScore += book.read_progress; //total
            }
        
        engagementRatio = readBooksScore / totalScore;
        newYearWeight = oldYearWeight + learningRate * actionIntensityFactor * (engagementRatio - oldYearWeight); //not normalized
    }

    // const mostEngagedGenre = Object.keys(newWeightForSingleGenre).reduce((a, b) =>
    //     newWeightForSingleGenre[a] > newWeightForSingleGenre[b] ? a : b
    // );
    // const mostEngagedLanguage = Object.keys(newWeightForSingleLanguage).reduce((a, b) =>
    //     newWeightForSingleLanguage[a] > newWeightForSingleLanguage[b] ? a : b
    // );
    let [normWeightPages,normWeightYear,normGenresWeight,normLangsWeight] = normalize(newNumberOfPagesWeight, newYearWeight, newGenresWeight, newLanguagesWeight);
    //update genres weights, redistribute
    const genreRatio = normGenresWeight / newGenresWeight;
    const normalizedGenreWeights = {};
    await clearUserGenresScore(userId);
    for (let genre in newWeightForSingleGenre) {
        normalizedGenreWeights[genre] = newWeightForSingleGenre[genre] * genreRatio;
    }
    // let totalNumberOfBooksRead = userGenresScore.reduce((sum, score) => sum + score.books_read_count, 0);
        
            for (const genre of mergedGenres) {
                const genreName = genre.genre_name_en;
                if (normalizedGenreWeights.hasOwnProperty(genreName)) {
                    genre.weight = normalizedGenreWeights[genreName];
                }
                await addUserGenresScore(userId, genre.genre_id, genre.weight, genre.books_read_count);
            }
    let newGenres = getTopTwoByReadCount(mergedGenres);
    await updateQuizAnswer(userId, normWeightPages, normWeightYear, normGenresWeight, normLangsWeight, newGenres, languages);
}