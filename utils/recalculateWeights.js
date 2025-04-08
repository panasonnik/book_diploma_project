import { normalizeData, getMinMax, normalize, findMostFrequent } from "../utils/mathOperationsUtils.js";
import { updateQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";

export async function recalculateWeights(userId, actionIntensityFactor, books, flag) {
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const savedBooks = await books;
    // let genres = quizAnswer.genre_preferences;
    // genres = genres.split(', ').map(genre => genre.trim());
    const oldGenresWeight = Number(quizAnswer.weights_genre);
    const oldPagesWeight = Number(quizAnswer.weights_number_of_pages);
    const oldYearWeight = Number(quizAnswer.weights_year_published);

    let languages = quizAnswer.language_preferences;
    languages = languages.split(', ').map(genre => genre.trim());
    const oldLanguagesWeight = Number(quizAnswer.weights_language);

    const learningRate = 0.4;

    let newGenresWeight = oldGenresWeight;
    let newNumberOfPagesWeight = oldPagesWeight;
    let newYearWeight = oldYearWeight;

    let genreCounts = {};
    for (let book of savedBooks) {
        let genres = book.genre_name_en.split(',').map(genre => genre.trim());
    
        for (let genre of genres) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
    }
    let mostCommonGenre = Object.keys(genreCounts).reduce((a, b) =>
        genreCounts[a] > genreCounts[b] ? a : b
    );

    const totalGenreCount = Object.values(genreCounts).reduce((sum, count) => sum + count, 0);
    let genrePercentage = genreCounts[mostCommonGenre] / totalGenreCount;
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
    
    if (genrePercentage >= 0.75 && flag) {
        newGenresWeight += learningRate * actionIntensityFactor * (1 - oldGenresWeight); 
    } else {
        newNumberOfPagesWeight += learningRate * actionIntensityFactor * (normPages - oldPagesWeight);
        newYearWeight += learningRate * actionIntensityFactor * (normYear - oldYearWeight);
    }
    // let mostFrequentGenres = findMostFrequent(savedBooks, 'genre_name_en');
    // let genresWithoutDuplicates = [...new Set(genres.concat(mostFrequentGenres[0].name))];
   
    let mostFrequentLanguages = findMostFrequent(savedBooks, 'language_en');
    let languagesWithoutDuplicates = [...new Set(languages.concat(mostFrequentLanguages[0].name))];

    const totalWeights = newNumberOfPagesWeight + newYearWeight + newGenresWeight + oldLanguagesWeight;

    let normWeightPages = normalize(newNumberOfPagesWeight, totalWeights);
    let normWeightYear = normalize(newYearWeight, totalWeights);
    let normGenresWeight = normalize(newGenresWeight, totalWeights);
    let normLangsWeight = normalize(oldLanguagesWeight, totalWeights);

    await updateQuizAnswer(userId, normWeightPages, normWeightYear, normGenresWeight, normLangsWeight, quizAnswer.genre_preferences, languagesWithoutDuplicates);
}