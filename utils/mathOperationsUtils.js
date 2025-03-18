export function normalizeData(current, mu, max, min) {
    if (min === max) return 1;
    return Math.exp(-Math.abs((current - mu) / (max - min)));
}
export function normalize(current, sum) {
    return current/sum;
}

export function getMinMax(array, key) {
    const minMax = array.map(item => item[key]);
    return {
        min: Math.min(...minMax),
        max: Math.max(...minMax)
    };
}

export function findMostFrequent(books, key) {
    const genreCounts = {};

    books.forEach(book => {
        if (book[key]) {
            book[key].split(',').forEach(name => {
                name = name.trim();
                genreCounts[name] = (genreCounts[name] || 0) + 1;
            });
        }
    });

    return Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));
}

