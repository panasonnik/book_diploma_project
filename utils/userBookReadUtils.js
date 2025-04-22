export async function getUserReadingHabits(statistics) {
  
    const lengthGroup = [
        {categoryName: 'short', completed: statistics.shortBooksCompleted, inProgress: statistics.shortBooksStarted, forgotten: statistics.shortBooksForgotten},
        {categoryName: 'medium', completed: statistics.mediumLengthBooksCompleted, inProgress: statistics.mediumLengthBooksStarted, forgotten: statistics.mediumLengthBooksForgotten},
        {categoryName: 'long', completed: statistics.longBooksCompleted, inProgress: statistics.longBooksStarted, forgotten: statistics.longBooksForgotten}
    ];

    const yearGroup = [
        {categoryName: 'old', completed: statistics.oldBooksCompleted, inProgress: statistics.oldBooksStarted, forgotten: statistics.oldBooksForgotten},
        {categoryName: 'medium', completed: statistics.mediumYearBooksCompleted, inProgress: statistics.mediumYearBooksStarted, forgotten: statistics.mediumYearBooksForgotten},
        {categoryName: 'new', completed: statistics.newBooksCompleted, inProgress: statistics.newBooksStarted, forgotten: statistics.newBooksForgotten}
    ];

    const completedGenres = getCount(statistics.genres);
    const forgottenGenres = getCount(statistics.genresForgotten);
    const completedLanguages = getCount(statistics.languages);
    const forgottenLanguages = getCount(statistics.languagesForgotten);

    // console.log("Genres: ", completedGenres);
    // console.log("Genres forgotten: ", forgottenGenres);
    // console.log("Languages: ", completedLanguages);
    // console.log("Languages forgotten: ", forgottenLanguages);

    const lengthRates = getRates(lengthGroup);
    
    const yearRates = getRates(yearGroup);
    console.log(yearRates);

    const genreRates = getQualitativeRates (completedGenres, forgottenGenres);
    const languageRates = getQualitativeRates (completedLanguages, forgottenLanguages);

    // console.log("Genre rates: ", genreRates);
    //genres with highest completedRate save to DB
    // console.log("Lang rates: ", languageRates);

    const bestWorstBookLength = getBestWorstRates(lengthRates, 'weightedScore');
    const bestWorstBookYear = getBestWorstRates(yearRates, 'weightedScore');

    const bestWorstBookLengthForgotten = getBestWorstRates(lengthRates, 'forgottenRate');
    const bestWorstBookYearForgotten = getBestWorstRates(yearRates, 'forgottenRate');

    // console.log(bestWorstBookLength);
    // console.log(bestWorstBookYear);

    // console.log("\n");
    // console.log(bestWorstBookLengthForgotten);
    // console.log(bestWorstBookYearForgotten);

    const bestWorstGenres = getBestWorstRates(genreRates, 'completedRate');
    const bestWorstLanguages = getBestWorstRates(languageRates, 'completedRate');
    const bestWorstGenresForgotten = getBestWorstRates(genreRates, 'forgottenRate');
    const bestWorstLanguagesForgotten = getBestWorstRates(languageRates, 'forgottenRate');

    const highestScoredGenres = getHighestScored(genreRates, completedGenres);
    //const highestScoredLanguages = getHighestScored(languageRates, completedLanguages);

    if(bestWorstBookLength.best.categoryName !== bestWorstBookLength.worst.categoryName) {
        console.log("User prefers ", bestWorstBookLength.best.categoryName, "-length books");
    }
    if(bestWorstBookYear.best.categoryName !== bestWorstBookYear.worst.categoryName) {
        console.log("User prefers ", bestWorstBookYear.best.categoryName, "-year books");
    }
    if(bestWorstBookLengthForgotten.best.categoryName !== bestWorstBookLengthForgotten.worst.categoryName) 
        console.log("User forgets ", bestWorstBookLengthForgotten.best.categoryName, "-length books");

    if(bestWorstBookYearForgotten.best.categoryName !== bestWorstBookYearForgotten.worst.categoryName) 
        console.log("User forgets ", bestWorstBookYearForgotten.best.categoryName, "-year books");

    if(bestWorstGenres.best.name !== bestWorstGenres.worst.name) 
        console.log("User prefers ", bestWorstGenres.best.name, "-genre books");

    if(bestWorstLanguages.best.name !== bestWorstLanguages.worst.name) 
        console.log("User prefers ", bestWorstLanguages.best.name, "-language books");

    if(bestWorstGenresForgotten.best.name !== bestWorstGenresForgotten.worst.name) 
        console.log("User forgets ", bestWorstGenresForgotten.best.name, "-genre books");

    if(bestWorstLanguagesForgotten.best.name !== bestWorstLanguagesForgotten.worst.name) 
        console.log("User forgets ", bestWorstLanguagesForgotten.best.name, "-language books");

    return {
        preferredLength: bestWorstBookLength.best.categoryName,
        preferredYear: bestWorstBookYear.best.categoryName,
        genrePreferences: highestScoredGenres,
        languagePreferences: bestWorstLanguages.best.name
    };
  }

  function getRates(group) {
    return group.map(category => {
        const total = category.completed + category.inProgress + category.forgotten;
        const completedRate = total !== 0 ? ((category.completed + category.inProgress) / total) : 0;
        const weightedScore = completedRate * Math.log(total + 1);
        return {
            categoryName: category.categoryName,
            completedRate,
            forgottenRate: total !== 0 ? category.forgotten / total : 0,
            weightedScore
        };
    });
  }
  
  function getBestWorstRates(group, key) {
    const best = group.reduce((best, current) => {
        return current[key] > best[key] ? current : best;
    });
    const worst = group.reduce((worst, current) => {
        return current[key] < worst[key] ? current : worst;
    });
    return {
        best,
        worst
    };
  }

  function getCount (arrayOfStrings) {
    const result = {};
    arrayOfStrings.forEach(item => {
        result[item] = (result[item] || 0) + 1;
    });
    return result;
  }

  function getQualitativeRates(groupCompleted, groupForgotten) {
    const unitedGroup = [...new Set([...Object.keys(groupCompleted), ...Object.keys(groupForgotten)])];

    return unitedGroup.map(item => {
        const completed = groupCompleted[item] || 0;
        const forgotten = groupForgotten[item] || 0;
        const total = completed + forgotten;

        return {
            name: item,
            completedRate: total !== 0 ? (completed/total) : 0, 
            forgottenRate: total !== 0 ? (forgotten/total) : 0
        };
    });

  }

  function getHighestScored(rates, counts) {
    const result = {};
    const maxRate = Math.max(...rates.map(item => item.completedRate));
    const topGenres = rates.filter(item => item.completedRate === maxRate);
    topGenres.forEach(item => {
        result[item.name] = counts[item.name] || 0;
    });
    return result;
  }
  