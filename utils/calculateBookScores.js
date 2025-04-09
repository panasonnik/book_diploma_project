import { getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore } from "../models/userBookScoreModel.js";
import { getUserGenresScore } from "../models/userGenresWeightsModel.js";
import { normalizeData, getMinMax, getLengthCategory, normalizeUsingMedian, getLengthValue, getYearCategory, getYearValue } from "../utils/mathOperationsUtils.js";

//initial book score calculation (each criteria weight = 0.25)
export async function calculateBookScores(quizAnswer) {
    const resolvedQuizAnswer = await quizAnswer;
    
    const booksByGenre = await getBooksWithGenres();
    const userGenresScore = await getUserGenresScore(resolvedQuizAnswer.user_id);
    let userGenrePreferences = resolvedQuizAnswer.genre_preferences.split(',').map(genre => genre.trim());

    let userLanguagePreferences = resolvedQuizAnswer.language_preferences.split(',').map(lang => lang.trim());
    let eachLanguageWeights = resolvedQuizAnswer.weights_language / userLanguagePreferences.length;

    const scoredBooks = [];
    const minMaxPages = getMinMax(booksByGenre, 'number_of_pages');
    const minMaxYear = getMinMax(booksByGenre, 'year_published');

    console.log("Min max: ", minMaxPages);
    console.log("Min max: ", minMaxYear);
    let score = 0;
    for (let book of booksByGenre) {
        let genreWords = book.genre_name_en.split(',').map(word => word.trim());
        if (getLengthCategory(book.number_of_pages) === resolvedQuizAnswer.preferred_length &&
            getYearCategory(book.year_published) === resolvedQuizAnswer.preferred_year ){
            // && userGenrePreferences.includes(genreWords)) {

        let normPages = normalizeUsingMedian(booksByGenre, book.number_of_pages, getLengthValue(resolvedQuizAnswer.preferred_length), 'number_of_pages');
        let normYear = normalizeUsingMedian(booksByGenre, book.year_published, getYearValue(resolvedQuizAnswer.preferred_year), 'year_published');

        

        let languageWords = book.language_en.split(',').map(word => word.trim());
        let numOfMatchingLanguages = userLanguagePreferences.filter(genre => languageWords.includes(genre)).length;
        let results = [];
        
        userGenrePreferences.forEach(userGenre => {
            const genre = userGenresScore.find(g => g.genre_name_en === userGenre);
            if (genre) {
                let calculatedWeight = genre.weight;
                results.push({ genre: userGenre, weight: calculatedWeight });
            }
        });
        let totalWeight = 0;

        genreWords.forEach(genre => {
            const matchingGenre = results.find(result => result.genre === genre);

            if (matchingGenre) {
                totalWeight += parseFloat(matchingGenre.weight);
            }
        });
        //let numOfMatchingGenres = userGenrePreferences.filter(genre => genreWords.includes(genre)).length;
        console.log("")
        console.log("Norm pages * weights: ", normPages * resolvedQuizAnswer.weights_number_of_pages);
        console.log("Norm year * weights: ", normYear * resolvedQuizAnswer.weights_year_published);
        console.log("Is book has language: ", numOfMatchingLanguages);
        console.log("Language weight: ", eachLanguageWeights);
        console.log("Genre score: ", totalWeight);
        console.log("----------");
        score = (normPages * resolvedQuizAnswer.weights_number_of_pages) + (normYear * resolvedQuizAnswer.weights_year_published) + totalWeight + (numOfMatchingLanguages * eachLanguageWeights);
        // if(!weights.languagePreferences.includes(book.language)) {
        //     score = 0;
        // }
        await addBookScore(resolvedQuizAnswer.user_id, book.book_id, score);
        scoredBooks.push({ ...book, score });
    }
    }
    return scoredBooks.sort((a, b) => b.score - a.score);
}