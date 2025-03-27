import { getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore } from "../models/userBookScoreModel.js";
import { getUserGenresScore } from "../models/userGenresWeightsModel.js";
import { normalizeData, getMinMax } from "./mathOperationsUtils.js";

// Initial book score calculation (each criterion weight = 0.25)
export async function promethee(quizAnswer) {
  const resolvedQuizAnswer = await quizAnswer;
  const books = await getBooksWithGenres();
  const userGenresScore = await getUserGenresScore(resolvedQuizAnswer.user_id);
 
  let genreWeights = {};
  userGenresScore.forEach(item => {
    genreWeights[item.genre_name_en] = item.weight;
});
console.log("Genre score: ", genreWeights);
const pages = books.map(m => m.number_of_pages);
const minPages = Math.min(...pages);
const maxPages = Math.max(...pages);

const years = books.map(m => m.year_published);
const minYear = Math.min(...years);
const maxYear = Math.max(...years);
let userLanguagePreferences = resolvedQuizAnswer.language_preferences.split(',').map(genre => genre.trim());

const weightPages = resolvedQuizAnswer.weights_number_of_pages;
const weightYear = resolvedQuizAnswer.weights_year_published;
const weightGenre = resolvedQuizAnswer.weights_genre;
const weightsLanguage = resolvedQuizAnswer.weights_language / userLanguagePreferences.length;


books.forEach(movie => {

  let languageWords = movie.language_en.split(',').map(word => word.trim());
  let numOfMatchingLanguages = userLanguagePreferences.filter(genre => languageWords.includes(genre)).length;

    movie.genreScore = Number(movie.genre_name_en.split(',').reduce((sum, genre) => sum + (genreWeights[genre] || 0), 0));

    movie.pagesNorm = normalizeData(movie.number_of_pages, maxPages, minPages, resolvedQuizAnswer.goal_pages);
    movie.yearsNorm = normalizeData(movie.year_published, maxYear, minYear, resolvedQuizAnswer.goal_year);
    movie.preferenceScore = weightGenre * movie.genreScore + weightPages * movie.pagesNorm + weightYear * movie.yearsNorm + weightsLanguage * numOfMatchingLanguages;
    console.log("Calculating book score for book ", movie.title_en);
    console.log(`genre ${(weightGenre)} * ${movie.genreScore} + pages ${weightPages} * ${movie.pagesNorm} + year ${weightYear} * ${movie.yearsNorm} + lang ${weightsLanguage} * ${numOfMatchingLanguages}`);
  });

// Sort movies by preference score (descending)
books.sort((a, b) => b.preferenceScore - a.preferenceScore);

// Output ranked movies
console.log("Ranked Books:");
books.forEach(movie => {
    console.log(`${movie.title_en} - ${movie.number_of_pages} - ${movie.year_published} - ${movie.genre_name_en} - ${movie.preferenceScore}`);
});
}
