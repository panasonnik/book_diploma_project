export function normalizeData(current, mu, max, min) {
    return 1 - Math.abs(current - mu) / Math.max(1, (max - min));
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