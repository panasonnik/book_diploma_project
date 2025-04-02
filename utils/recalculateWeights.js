import { normalizeData, getMinMax, normalize, findMostFrequent } from "../utils/mathOperationsUtils.js";
import { updateQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";

export async function recalculateWeights(userId, actionIntensityFactor, books) {
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const savedBooks = await books;
    // let genres = quizAnswer.genre_preferences;
    // genres = genres.split(', ').map(genre => genre.trim());
    const oldGenresWeight = Number(quizAnswer.weights_genre);

    let languages = quizAnswer.language_preferences;
    languages = languages.split(', ').map(genre => genre.trim());
    const oldLanguagesWeight = Number(quizAnswer.weights_language);

    const learningRate = 0.4;
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
    
    let newNumberOfPagesWeight = Number(quizAnswer.weights_number_of_pages) + learningRate * actionIntensityFactor * (normPages - Number(quizAnswer.weights_number_of_pages));
    let newYearWeight = Number(quizAnswer.weights_year_published) + learningRate * actionIntensityFactor * (normYear - Number(quizAnswer.weights_year_published));
    
    // let mostFrequentGenres = findMostFrequent(savedBooks, 'genre_name_en');
    // let genresWithoutDuplicates = [...new Set(genres.concat(mostFrequentGenres[0].name))];
   
    let mostFrequentLanguages = findMostFrequent(savedBooks, 'language_en');
    let languagesWithoutDuplicates = [...new Set(languages.concat(mostFrequentLanguages[0].name))];

    const totalWeights = newNumberOfPagesWeight + newYearWeight + oldGenresWeight + oldLanguagesWeight;

    let normWeightPages = normalize(newNumberOfPagesWeight, totalWeights);
    let normWeightYear = normalize(newYearWeight, totalWeights);
    let normGenresWeight = normalize(oldGenresWeight, totalWeights);
    let normLangsWeight = normalize(oldLanguagesWeight, totalWeights);

    await updateQuizAnswer(userId, normWeightPages, normWeightYear, normGenresWeight, normLangsWeight, quizAnswer.genre_preferences, languagesWithoutDuplicates);
}