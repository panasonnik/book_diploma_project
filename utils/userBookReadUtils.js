import { getBookGenre, getGenreIdByName } from "../models/genreModel.js";
import { getQuizAnswerByUserId } from "../models/quizAnswerModel.js";
import { getUserGenresScore, addUserGenresScore, clearUserGenresScore } from "../models/userGenresWeightsModel.js";


export async function addReadBookGenre (userId, bookId) {
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const totalGenreWeights = quizAnswer.weights_genre;

    const userGenreWeights = await getUserGenresScore(userId);
    let readBookGenres = await getBookGenre(bookId);
    readBookGenres = readBookGenres.split(",");
    const genreWeightsFromDB = userGenreWeights.map(genre => ({
        name: genre.genre_name_en,
        count: genre.books_read_count
    }));

    const newGenres = Object.values(
        readBookGenres.reduce((acc, genre) => {
          if (!acc[genre]) {
            acc[genre] = { name: genre, count: 0 };
          }
          acc[genre].count++;
          return acc;
        }, {})
    );
    
    const mergedGenres = mergeGenres(genreWeightsFromDB, newGenres);
   
    let totalNumberOfBooksRead = mergedGenres.reduce((sum, item) => sum + item.count, 0);

    await clearUserGenresScore(userId);
    mergedGenres.forEach(async (genre) => {
        let genreProportion = genre.count / totalNumberOfBooksRead;
        let genreWeightPart = totalGenreWeights * genreProportion;
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