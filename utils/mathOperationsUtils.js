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
    const values = books.flatMap(book => book[key].split(',').map(value => value.trim()));
    const valueCount = values.reduce((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});

  const maxCount = Math.max(...Object.values(valueCount));
  return Object.keys(valueCount).filter(genre => valueCount[genre] === maxCount);
}