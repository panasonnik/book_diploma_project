import { normalizeData, getMinMax, normalize } from "../utils/mathOperationsUtils.js";
import { updateQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { getUserGenresScore, clearUserGenresScore, addUserGenresScore } from "../models/userGenresWeightsModel.js";

export async function recalculateWeights(userId, actionIntensityFactor, books, changeGenreFlag, changeLanguageFlag) {
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const userGenresScore = await getUserGenresScore(userId);
    const savedBooks = await books;
    // let genres = quizAnswer.genre_preferences;
    // genres = genres.split(', ').map(genre => genre.trim());
    const oldGenresWeight = Number(quizAnswer.weights_genre);
    const oldLanguagesWeight = Number(quizAnswer.weights_language);
    const oldPagesWeight = Number(quizAnswer.weights_number_of_pages);
    const oldYearWeight = Number(quizAnswer.weights_year_published);

    let languages = quizAnswer.language_preferences;

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

    let mostCommonGenre = Object.keys(genreCounts).reduce((a, b) =>
        genreCounts[a] > genreCounts[b] ? a : b
    );
    let mostCommonLang = Object.keys(languageCounts).reduce((a, b) =>
        languageCounts[a] > languageCounts[b] ? a : b
    );

    const totalGenreCount = Object.values(genreCounts).reduce((sum, count) => sum + count, 0);
    let genrePercentage = genreCounts[mostCommonGenre] / totalGenreCount;

    const totalLanguagesCount = Object.values(genreCounts).reduce((sum, count) => sum + count, 0);
    let languagesPercentage = languageCounts[mostCommonLang] / totalLanguagesCount;

    let sumOfYears = 0;
    let sumOfPages = 0;
    for(let book of savedBooks) {
        sumOfYears += book.year_published;
        sumOfPages += book.number_of_pages;
    }
    const minMaxPages = getMinMax(savedBooks, 'number_of_pages');
    const minMaxYear = getMinMax(savedBooks, 'year_published');
   
    let avgSavedYear = sumOfYears/savedBooks.length;
    let avgSavedPages = sumOfPages/savedBooks.length;
    
    let normYear = normalizeData(avgSavedYear, minMaxYear.max, minMaxYear.min, quizAnswer.goal_year);
    let normPages = normalizeData(avgSavedPages, minMaxPages.max, minMaxPages.min, quizAnswer.goal_pages);
    
    if (genrePercentage >= 0.5 && changeGenreFlag) {
        newGenresWeight += learningRate * actionIntensityFactor * (1 - oldGenresWeight); 
    } else if (languagesPercentage >= 0.5 && changeLanguageFlag) {
        newLanguagesWeight += learningRate * actionIntensityFactor * (1 - oldLanguagesWeight); 
    } else {
        newNumberOfPagesWeight += learningRate * actionIntensityFactor * (normPages - oldPagesWeight);
        newYearWeight += learningRate * actionIntensityFactor * (normYear - oldYearWeight);
    }


    let [normWeightPages,normWeightYear,normGenresWeight,normLangsWeight] = normalize(Number(newNumberOfPagesWeight), Number(newYearWeight), Number(newGenresWeight), Number(oldLanguagesWeight));
    
    //update genres weights, redistribute
    let totalNumberOfBooksRead = userGenresScore.reduce((sum, score) => sum + score.books_read_count, 0);
        
        await clearUserGenresScore(userId);
            for (const genre of userGenresScore) {
                let genreProportion = genre.books_read_count / totalNumberOfBooksRead;
                let genreWeightPart = normGenresWeight * genreProportion;
                await addUserGenresScore(userId, genre.genre_id, genreWeightPart, genre.books_read_count);
            }

    await updateQuizAnswer(userId, normWeightPages, normWeightYear, normGenresWeight, normLangsWeight, mostCommonGenre, languages);
}