import { getPagesRange, getYearRange } from '../models/appSettingsModel.js';

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

// export function normalizeUsingMedian(array, current, median, key, preference) {
//     const maxDev = maxDeviation(array, key, median);

//     if (preference === 'medium') {
//         return 1 - Math.abs(current - median) / maxDev;
//     } else if (preference === 'new') {
//         const maxValue = Math.max(...array.map(item => item[key]));
//         return (current - median) / (maxValue - median);
//     } else if (preference === 'old') {
//         const minValue = Math.min(...array.map(item => item[key]));
//         return (median - current) / (median - minValue);
//     } else {
//         return 0; // fallback
//     }
// }

export function normalizeByPreference(current, preference, globalMin, globalMax, lowerBound, upperBound, median) {

    if (current >= lowerBound && current <= upperBound) {
        return 1;
    }

    if (current > upperBound) {
        const denomRange = globalMax - upperBound;
        if(denomRange === 0) return 0;
        return Math.max(0, 1 - (current - upperBound) / denomRange);
    } else if (current < lowerBound) {
        const denomRange = lowerBound - globalMin;
        if(denomRange === 0) return 0;
        return Math.max(0, 1 - (lowerBound - current) / denomRange);
    }
    return 0;
}



export function normalizeData(current, preference, min, median, max) {
    if (preference === 'long' || preference === 'new') {
        return Math.max(0, Math.min(1, (current - median) / (max - median)));
    } else if (preference === 'medium') {
        const maxDeviation = Math.max(median - min, max - median);
        return Math.max(0, Math.min(1, 1 - Math.abs(current - median) / maxDeviation));
    } else if (preference === 'short' || preference === 'old') {
        return Math.max(0, Math.min(1, (median - current) / (median - min)));
    } else {
        throw new Error('Unknown preference type');
    }
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

export async function getLengthCategory(value) {
    const pagesData = await getPagesRange();
    if (value < pagesData[0].pages_median_min) return 'short';
    if (value >= pagesData[0].pages_median_min && value <= pagesData[0].pages_median_max) return 'medium';
    return 'long';
}

export async function getMedianLength(category) {
    const pagesData = await getPagesRange();
    if (category === 'short') return Math.round(((Number(pagesData[0].pages_median_min)) + pagesData[0].pages_min)/2);
    if (category === 'medium') return Math.round((Number(pagesData[0].pages_median_min)) + (Number(pagesData[0].pages_median_max))/2);
    return Math.round(((Number(pagesData[0].pages_median_max)) + pagesData[0].pages_max)/2);
}

export async function getLengthRangeFromPreference(category) {
    const pagesData = await getPagesRange();
    if (category === 'short') return [Number(pagesData[0].pages_median_min), pagesData[0].pages_min];
    if (category === 'medium') return [Number(pagesData[0].pages_median_min), Number(pagesData[0].pages_median_max)];
    return [Number(pagesData[0].pages_median_max), pagesData[0].pages_max];
}

export async function getYearCategory(value) {
    const yearData = await getYearRange();
    if (value < yearData[0].year_median_min) return 'old';
    if (value >= yearData[0].year_median_min && value <= yearData[0].year_median_max) return 'medium';
    return 'new';
}
export async function getMedianYear(category) {
    const yearData = await getYearRange();
    if (category === 'new') return Math.round(((Number(yearData[0].year_median_max)) + yearData[0].year_max)/2);
    if (category === 'medium') return Math.round((Number(yearData[0].year_median_min)) + (Number(yearData[0].year_median_max))/2);
    return Math.round(((Number(yearData[0].year_median_min)) + yearData[0].year_min)/2);
}

export async function getYearRangeFromPreference(category) {
    const yearData = await getYearRange();
    if (category === 'new') return [Number(yearData[0].year_median_max),yearData[0].year_max];
    if (category === 'medium') return [Number(yearData[0].year_median_min), Number(yearData[0].year_median_max)];
    return [Number(yearData[0].year_median_min), yearData[0].year_min];
}
  

