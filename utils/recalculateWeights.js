import { getSavedBooks } from '../models/userModel.js';
import { normalizeData, getMinMax, normalize, findMostFrequent } from "../utils/bookScoreUtils.js";
import { updateQuizAnswer, getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { getTranslations } from './getTranslations.js';

export async function recalculateWeights(req, res) {
    const userId = req.user.userId;
    const translations = getTranslations(req);
    const quizAnswer = await getQuizAnswerByUserId(userId);
    console.log("Quiz answer: ", quizAnswer);
    const savedBooks = await getSavedBooks(userId);
    console.log("Saved books", savedBooks);
    
    let genres = quizAnswer.genre_preferences;
    genres = genres.split(', ').map(genre => genre.trim());
    const oldGenresWeight = quizAnswer.weights_genre * genres.length;

    let languages = quizAnswer.language_preferences;
    languages = languages.split(', ').map(genre => genre.trim());
    const oldLanguagesWeight = quizAnswer.weights_language * languages.length;
    const learningRate = 0.2;
    const actionIntensityFactor = 0.5;
    let sumOfYears = 0;
    let sumOfPages = 0;
    for(let book of savedBooks) {
        sumOfYears += book.year_published;
        sumOfPages += book.number_of_pages;
    }
    const minMaxPages = getMinMax(savedBooks, 'number_of_pages');
    const minMaxYear = getMinMax(savedBooks, 'year_published');
    console.log("-------");
    console.log("Min-max pages of saved books: ", minMaxPages);
    console.log("Min-max year of saved books: ", minMaxYear);
    let avgSavedYear = sumOfYears/savedBooks.length;
    let avgSavedPages = sumOfPages/savedBooks.length;
    let normYear = normalizeData(avgSavedYear, quizAnswer.mu_year, minMaxYear.max, minMaxYear.min);
    let normPages = normalizeData(avgSavedPages, quizAnswer.mu_pages, minMaxPages.max, minMaxPages.min);
    console.log("Norm value of year: ", normYear);
    console.log("Norm value of pages: ", normPages);
    let newNumberOfPagesWeight = Number(quizAnswer.weights_number_of_pages) + learningRate * actionIntensityFactor * (normPages - Number(quizAnswer.weights_number_of_pages));
    let newYearWeight = Number(quizAnswer.weights_year_published) + learningRate * actionIntensityFactor * (normYear - Number(quizAnswer.weights_year_published));

    console.log("New weight of pages: ", newNumberOfPagesWeight);
    console.log("New year weight ", newYearWeight);

    
    let mostFrequentGenres = findMostFrequent(savedBooks, 'genre_name_en');
    let genresWithoutDuplicates = [...new Set(genres.concat(mostFrequentGenres))];
    let newGenreWeight = oldGenresWeight/genresWithoutDuplicates.length;
    console.log("Most frequent genres with previous: ", genresWithoutDuplicates);
    console.log("Weights of genres: ", newGenreWeight);

    let mostFrequentLanguages = findMostFrequent(savedBooks, 'language_en');
    let languagesWithoutDuplicates = [...new Set(languages.concat(mostFrequentLanguages))];
    let newLanguageWeight = oldLanguagesWeight/languagesWithoutDuplicates.length;
    console.log("Most frequent languages with previous: ", languagesWithoutDuplicates);
    console.log("Weights of languages: ", newLanguageWeight);
    const totalWeights = newNumberOfPagesWeight+newYearWeight+newGenreWeight+newLanguageWeight;
    let normWeightPages = normalize(newNumberOfPagesWeight, totalWeights);
    let normWeightYear = normalize(newYearWeight, totalWeights);
    let normGenresWeight = normalize(newGenreWeight, totalWeights);
    let normLangsWeight = normalize(newLanguageWeight, totalWeights);
    console.log("Total weights: ", totalWeights);

    console.log("Normalized weights after all: ");
    console.log("Pages: ", normWeightPages);
    console.log("Year: ", normWeightYear);
    console.log("Genres: ", normGenresWeight);
    console.log("Languages: ", normLangsWeight);

    await updateQuizAnswer(userId, normWeightPages, normWeightYear, normGenresWeight, normLangsWeight, genresWithoutDuplicates, languagesWithoutDuplicates);
    res.redirect(`/${translations.lang}/home`);
}