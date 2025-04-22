import { getGenreIdByName } from "../models/genreModel.js";
import { getQuizAnswerByUserId, updateGenreLanguagePreferences, updateQuantitativeCriterionsQuizAnswer } from "../models/quizAnswerModel.js";
import { addUserGenresScore, clearUserGenresScore } from "../models/userGenresWeightsModel.js";
import { findMostFrequent, getAverage, getLengthCategory, getYearCategory } from "./mathOperationsUtils.js";
import { getUserReadBooks } from '../models/userBooksModel.js';
import { getUserReadingHabits } from "./userBookReadUtils.js";

export async function updateGenreLanguage(userId, readBooks) {
    const resolvedReadBooks = await readBooks;
    const quizAnswer = await getQuizAnswerByUserId(userId);

    let genres = quizAnswer.genre_preferences;
    
    let languages = quizAnswer.language_preferences;
    
    let mostFrequentAddedGenre = findMostFrequent(resolvedReadBooks, 'genre_name_en');
    let genresWithoutDuplicates = [...new Set(Array(genres).concat(mostFrequentAddedGenre[0].name))];  
    
    let mostFrequentAddedLanguage = findMostFrequent(resolvedReadBooks, 'language_en');
    let languagesWithoutDuplicates = [...new Set(Array(languages).concat(mostFrequentAddedLanguage[0].name))];

    await updateGenreLanguagePreferences(userId, genresWithoutDuplicates, languagesWithoutDuplicates);
}

export async function updateQuantitativeCriterions (userId, readBooks) {
    const resolvedReadBooks = await readBooks;
    
    const avgBookYear = getAverage(resolvedReadBooks, 'year_published');

    const avgBookPages = getAverage(resolvedReadBooks, 'number_of_pages');

    let newPreferredLength = getLengthCategory(avgBookPages);
    let newPreferredYear = getYearCategory(avgBookYear);
    await updateQuantitativeCriterionsQuizAnswer(userId, newPreferredLength, newPreferredYear);
}

export async function updateGenreWeights (userId, genresObj) {
    const quizAnswer = await getQuizAnswerByUserId(userId);
    const totalGenreWeights = quizAnswer.weights_genre;

    let totalNumberOfBooksRead = Object.values(genresObj).reduce((sum, count) => sum + count, 0);

    await clearUserGenresScore(userId);
    for (const [genre, count] of Object.entries(genresObj)) {
        let genreProportion = count / totalNumberOfBooksRead;
        let genreWeightPart = totalGenreWeights * genreProportion;
        const genreId = await getGenreIdByName(genre);
        await addUserGenresScore(userId, genreId, genreWeightPart, count);
    }
}

export async function updateUserBookReading (userId) {
    const userBooksReading = await getUserReadBooks(userId);
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    let statistics = {
        shortBooksCompleted: 0,
        shortBooksStarted: 0,
        shortBooksForgotten: 0,

        mediumLengthBooksCompleted: 0,
        mediumLengthBooksStarted: 0,
        mediumLengthBooksForgotten: 0,

        longBooksCompleted: 0,
        longBooksStarted: 0,
        longBooksForgotten: 0,

        newBooksCompleted: 0,
        newBooksStarted: 0,
        newBooksForgotten: 0,

        mediumYearBooksCompleted: 0,
        mediumYearBooksStarted: 0,
        mediumYearBooksForgotten: 0,

        oldBooksCompleted: 0,
        oldBooksStarted: 0,
        oldBooksForgotten: 0,

        genres: [],
        genresForgotten: [],
        languages: [],
        languagesForgotten: []
    };
    for(const book of userBooksReading) {
        console.log(book);
        const timeInMsSinceLastUpdate = new Date() - book.updated_at;
        const percentageRead = (book.pages_read / book.number_of_pages) * 100;
        const bookLengthCategory = await getLengthCategory(book.number_of_pages);
        const bookYearCategory = await getYearCategory(book.year_published);
        // const isForgotten = percentageRead < 30 && timeInMsSinceLastUpdate > oneWeekMs;
        const isForgotten = percentageRead < 30;
        
        if(!isForgotten) {
            statistics.genres.push(...book.genre_name_en.split(',').map(g => g.trim()));
            statistics.languages.push(...book.language_en.split(',').map(l => l.trim()));
        } else {
            statistics.genresForgotten.push(...book.genre_name_en.split(',').map(g => g.trim()));
            statistics.languagesForgotten.push(...book.language_en.split(',').map(l => l.trim()));
        }

        if (bookLengthCategory === 'short') {
            if(percentageRead >= 75) statistics.shortBooksCompleted += 1;
            else if(!isForgotten) statistics.shortBooksStarted += 1;
            else if (isForgotten) statistics.shortBooksForgotten += 1;
        }
        else if (bookLengthCategory === 'medium') {
            if(percentageRead >= 75) statistics.mediumLengthBooksCompleted += 1;
            else if(!isForgotten) statistics.mediumLengthBooksStarted += 1;
            else if (isForgotten) statistics.mediumLengthBooksForgotten += 1;
        }
        else if (bookLengthCategory === 'long') {
            if(percentageRead >= 75) statistics.longBooksCompleted += 1;
            else if(!isForgotten) statistics.longBooksStarted += 1;
            else if (isForgotten) statistics.longBooksForgotten += 1;
        }

        if (bookYearCategory === 'old') {
            if(percentageRead >= 75) statistics.oldBooksCompleted += 1;
            else if(!isForgotten) statistics.oldBooksStarted += 1;
            else if (isForgotten) statistics.oldBooksForgotten += 1;
        }
        else if (bookYearCategory === 'medium') {
            if(percentageRead >= 75) statistics.mediumYearBooksCompleted += 1;
            else if(!isForgotten) statistics.mediumYearBooksStarted += 1;
            else if (isForgotten) statistics.mediumYearBooksForgotten += 1;
        }
        else if (bookYearCategory === 'new') {
            if(percentageRead >= 75) statistics.newBooksCompleted += 1;
            else if(!isForgotten) statistics.newBooksStarted += 1;
            else if (isForgotten) statistics.newBooksForgotten += 1;
        }
    }

    const readingHabits = await getUserReadingHabits(statistics);
    console.log(readingHabits);
    await updateQuantitativeCriterionsQuizAnswer(userId, readingHabits.preferredLength, readingHabits.preferredYear);
    await updateGenreLanguagePreferences(userId, Object.keys(readingHabits.genrePreferences), readingHabits.languagePreferences);
}