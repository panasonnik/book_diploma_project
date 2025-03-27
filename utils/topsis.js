import { getBooksWithGenres } from "../models/bookModel.js";
import { addBookScore } from "../models/userBookScoreModel.js";
import { getUserGenresScore } from "../models/userGenresWeightsModel.js";
import { normalizeData, getMinMax } from "../utils/mathOperationsUtils.js";

// Initial book score calculation (each criterion weight = 0.25)
export async function topsis(quizAnswer) {
  const resolvedQuizAnswer = await quizAnswer;
  const books = await getBooksWithGenres();
  const userGenresScore = await getUserGenresScore(resolvedQuizAnswer.user_id);
  const eachLanguageWeights = resolvedQuizAnswer.weights_language / resolvedQuizAnswer.language_preferences.split(",").length;

  const criteria = ['number_of_pages', 'year_published', 'language', 'genreScore']; 
  const criteriaWeights = [
    resolvedQuizAnswer.weights_number_of_pages,
    resolvedQuizAnswer.weights_year_published,
    resolvedQuizAnswer.weights_language,
  ];

  const genreWeights = userGenresScore.reduce((acc, item) => {
    acc[item.genre_name_en] = item.weight;
    return acc;
}, {});

console.log("Criteria Weights: ", criteriaWeights);
console.log("Genre Weights: ", genreWeights);

// Modified calculateGenreScore to assign 1 if genre is present and 0 if not
const calculateGenreScore = (genres) => {
    return genres.reduce((total, genre) => {
        const trimmedGenre = genre.trim();
        // Assign 1 if genre is present in genreWeights, otherwise 0
        return total + (genreWeights[trimmedGenre] ? 1 : 0);
    }, 0);
};

const languagePreferences = resolvedQuizAnswer.language_preferences;

const matrix = books.map(alt => {
    const genres = typeof alt.genre_name_en === 'string' ? alt.genre_name_en.split(",") : alt.genre_name_en;

    const languageScore = languagePreferences.includes(alt.language_en) ? eachLanguageWeights : 0;

    return [
        alt.number_of_pages, 
        alt.year_published, 
        languageScore,
        calculateGenreScore(genres), // Use updated genre scoring logic
    ];
});

console.log("Matrix:", matrix);


function calculateNorm(matrix) {
    return matrix[0].map((_, colIdx) => {
      return Math.sqrt(matrix.reduce((sum, row) => sum + row[colIdx] ** 2, 0));
    });
}

  function normalizeMatrix(matrix, norms) {
    return matrix.map(row => row.map((value, idx) => value / norms[idx]));
  }

const norms = calculateNorm(matrix);
const normalizedMatrix = normalizeMatrix(matrix, norms);

  function applyWeights(normalizedMatrix, weights) {
    return normalizedMatrix.map(row => row.map((value, idx) => value * weights[idx] || value));
  }

  const weightedMatrix = applyWeights(normalizedMatrix, criteriaWeights);

  function calculateIdealAndAntiIdeal(weightedMatrix, criteriaTypes) {
    const ideal = weightedMatrix[0].map((_, colIdx) => {
      if (criteriaTypes[colIdx] === 'max') {
        return Math.max(...weightedMatrix.map(row => row[colIdx]));
      } else {
        return Math.min(...weightedMatrix.map(row => row[colIdx]));
      }
    });
  
    const antiIdeal = weightedMatrix[0].map((_, colIdx) => {
      if (criteriaTypes[colIdx] === 'max') {
        return Math.min(...weightedMatrix.map(row => row[colIdx]));
      } else {
        return Math.max(...weightedMatrix.map(row => row[colIdx]));
      }
    });
  
    return { ideal, antiIdeal };
  }
  
    const criteriaTypes = [resolvedQuizAnswer.goal_pages, resolvedQuizAnswer.goal_year, 'max', 'max'];
    const { ideal, antiIdeal } = calculateIdealAndAntiIdeal(weightedMatrix, criteriaTypes);

    console.log("Ideal Solution:", ideal);
    console.log("Anti-Ideal Solution:", antiIdeal);

  function calculateDistances(weightedMatrix, ideal, antiIdeal) {
    return weightedMatrix.map(row => {
      const distanceToIdeal = Math.sqrt(row.reduce((sum, value, idx) => sum + (value - ideal[idx]) ** 2, 0));
      const distanceToAntiIdeal = Math.sqrt(row.reduce((sum, value, idx) => sum + (value - antiIdeal[idx]) ** 2, 0));
      return { distanceToIdeal, distanceToAntiIdeal };
    });
  }

  const distances = calculateDistances(weightedMatrix, ideal, antiIdeal);

  function calculateCloseness(distances) {
    return distances.map(({ distanceToIdeal, distanceToAntiIdeal }) => {
      return distanceToAntiIdeal / (distanceToIdeal + distanceToAntiIdeal);
    });
  }

  const closeness = calculateCloseness(distances);

  const rankedAlternatives = books.map((alt, idx) => ({
    title: alt.title_en,
    pages: alt.number_of_pages,
    year: alt.year_published,
    genres: alt.genre_name_en,
    closeness: closeness[idx],
  }));

  rankedAlternatives.sort((a, b) => b.closeness - a.closeness);
  console.log('Ranked Alternatives:', rankedAlternatives);
}
