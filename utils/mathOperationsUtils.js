export function normalizeData(current, max, min, direction) {
    if(direction === 'max') return ((current - min)/(max-min));
    if(direction === 'min') return ((max - current)/(max-min));
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

