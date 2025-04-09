export function normalizeData(current, max, min, direction) {
    if(direction === 'max') return ((current - min)/(max-min));
    if(direction === 'min') return ((max - current)/(max-min));
}
export function normalize(...values) {
    const sum = values.reduce((total, val) => total+val, 0);
    return values.map(val => val/sum);
}

export function getMinMax(array, key) {
    const minMax = array.map(item => item[key]);
    return {
        min: Math.min(...minMax),
        max: Math.max(...minMax)
    };
}

export function normalizeUsingMedian(array, current, median, key) { 
    return 1 - Math.abs(current - median) / maxDeviation(array, key, median);
}
function maxDeviation (array, key, median) {
    const values = array.map(item => item[key]);
    return Math.max(...values.map(v => Math.abs(v - median)));
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

export function getAverage (books, key) {
    const userBookSet = books.map(book => book[key]);
    return userBookSet.reduce((sum, value) => sum + value, 0) / userBookSet.length;
}

export function findMedian(values) {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid];
}

export function getLengthCategory(value) {
    if (value <= 300) return 'short';
    if (value > 300 && value <= 600) return 'medium';
    return 'long';
}

export function getLengthValue(category) {
    if (category === 'short') return 150;
    if (category === 'medium') return 450;
    return 750;
}

export function getYearCategory(value) {
    if (value <= 1900) return 'old';
    if (value > 1900 && value <= 2000) return 'medium';
    return 'new';
}
export function getYearValue(category) {
    if (category === 'new') return 2012;
    if (category === 'medium') return 1950;
    return 1850;
}
  

