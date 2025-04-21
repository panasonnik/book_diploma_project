import { normalizeData, getMinMax, normalize } from "../utils/mathOperationsUtils.js";
import { updateQuizAnswer, getQuizAnswerByUserId, getPagesRange, getYearRange } from "../models/quizAnswerModel.js";
import { getUserGenresScore, clearUserGenresScore, addUserGenresScore } from "../models/userGenresWeightsModel.js";
import { getUserBooksWithLanguage } from "../models/userBooksModel.js";
import { getLanguageCount } from "../models/bookModel.js";

export async function recalculateWeights(userId, actionIntensityFactor, books, isLikedBooksPassedOn) {
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const userGenresScore = await getUserGenresScore(userId);
    const savedBooks = await books;
    const booksWithLanguage = await getUserBooksWithLanguage(userId);
    const languageCount = await getLanguageCount();
    const pagesRange = await getPagesRange(userId);
    const yearRange = await getYearRange(userId);
    const signal = 0.2; //constant to change weights slightly when user liked books

    // let genres = quizAnswer.genre_preferences;
    // genres = genres.split(', ').map(genre => genre.trim());
    const oldGenresWeight = Number(quizAnswer.weights_genre);
    const oldLanguagesWeight = Number(quizAnswer.weights_language);
    const oldPagesWeight = Number(quizAnswer.weights_number_of_pages);
    const oldYearWeight = Number(quizAnswer.weights_year_published);

    let languages = quizAnswer.language_preferences;
    let genres = quizAnswer.genre_preferences;

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
    //console.log(userGenresScore);
    
    let newWeightForSingleGenre = {};
    let newWeightForSingleLanguage = {};
    if(!isLikedBooksPassedOn) {
        for (const genre of userGenresScore) {
            newWeightForSingleGenre[genre.genre_name_en.split(",")] = Number(genre.weight) + learningRate * actionIntensityFactor * (genre.books_read_count * genre.avg_read_progress - Number(genre.weight));
            //await addUserGenresScore(userId, genre.genre_id, genreWeightPart, genre.books_read_count);
        }
        for (const lang of booksWithLanguage) {
            newWeightForSingleLanguage[lang.language_en.split(",")] = oldLanguagesWeight/languageCount + learningRate * actionIntensityFactor * (lang.books_read_count * lang.avg_read_progress - oldLanguagesWeight/languageCount);
        }
    }
    newGenresWeight = Object.values(newWeightForSingleGenre).reduce((sum, count) => sum + count, 0); //not normalized
    newLanguagesWeight = Object.values(newWeightForSingleLanguage).reduce((sum, count) => sum + count, 0); //not normalized
    
    if(isLikedBooksPassedOn) {
        newNumberOfPagesWeight += learningRate * actionIntensityFactor * (signal - oldPagesWeight);
        newYearWeight += learningRate * actionIntensityFactor * (signal - oldYearWeight);
    } else {
        let readBooksScore = 0;
        let totalScore = 0;
        let engagementRatio = 0;
        //if we're dealing with read books, calculate new weights based on reading progress
        savedBooks.forEach(book => {
            if (book.number_of_pages >= pagesRange.min_pages && book.number_of_pages <= pagesRange.max_pages) {
                readBooksScore += read_progress; //if book is in desired range
            }
            totalScore += read_progress; //total
        });
        engagementRatio = readBooksScore / totalScore;
        newNumberOfPagesWeight = oldPagesWeight + learningRate * actionIntensityFactor * (engagementRatio - oldPagesWeight); //not normalized

        readBooksScore = 0;
        totalScore = 0;
        savedBooks.forEach(book => {
            if (book.year_published >= yearRange.min_year && book.year_published <= yearRange.max_year) {
                readBooksScore += read_progress; //if book is in desired range
            }
            totalScore += read_progress; //total
        });
        engagementRatio = readBooksScore / totalScore;
        newYearWeight = oldYearWeight + learningRate * actionIntensityFactor * (engagementRatio - oldYearWeight); //not normalized
    }

    // const mostEngagedGenre = Object.keys(newWeightForSingleGenre).reduce((a, b) =>
    //     newWeightForSingleGenre[a] > newWeightForSingleGenre[b] ? a : b
    // );
    // const mostEngagedLanguage = Object.keys(newWeightForSingleLanguage).reduce((a, b) =>
    //     newWeightForSingleLanguage[a] > newWeightForSingleLanguage[b] ? a : b
    // );

    let [normWeightPages,normWeightYear,normGenresWeight,normLangsWeight] = normalize(Number(newNumberOfPagesWeight), Number(newYearWeight), Number(newGenresWeight), Number(newLanguagesWeight));
    
    //update genres weights, redistribute
    let totalNumberOfBooksRead = userGenresScore.reduce((sum, score) => sum + score.books_read_count, 0);
        
        await clearUserGenresScore(userId);
            for (const genre of userGenresScore) {
                let genreProportion = genre.books_read_count / totalNumberOfBooksRead;
                let genreWeightPart = normGenresWeight * genreProportion;
                await addUserGenresScore(userId, genre.genre_id, genreWeightPart, genre.books_read_count);
            }

    await updateQuizAnswer(userId, normWeightPages, normWeightYear, normGenresWeight, normLangsWeight, genres, languages);
}