import { setAppSettings } from "../models/appSettingsModel.js";
import { getBookPagesMetrics, getBookYearMetrics } from '../models/bookModel.js';

export async function initAppSettings() {
    const pagesMetrics = await getBookPagesMetrics();
    const yearMetrics = await getBookYearMetrics();

    const pagesMedian = Math.round(Number(pagesMetrics.median));
    const yearMedian = Math.round(Number(yearMetrics.median));

    const pagesDeviation = Math.round(pagesMedian * 0.3); //30%
    const yearDeviation = Math.round(yearMedian * 0.03); //3%

    let lowerBoundPages = Math.round(pagesMedian - pagesDeviation);
    lowerBoundPages = Math.max(lowerBoundPages, pagesMetrics.min_pages);
    let upperBoundPages = Math.round(pagesMedian + pagesDeviation);
    upperBoundPages = Math.min(upperBoundPages, pagesMetrics.max_pages);

    let lowerBoundYear = Math.round(yearMedian - yearDeviation);
    lowerBoundYear = Math.max(lowerBoundYear, yearMetrics.min_year);
    let upperBoundYear = Math.round(yearMedian + yearDeviation);
    upperBoundYear = Math.min(upperBoundYear, yearMetrics.max_year);

    const settings = [
      { key: 'pages_median_min', value: `${Math.max(pagesMetrics.min_pages, lowerBoundPages)}`},
      { key: 'pages_median_max', value: `${Math.min(pagesMetrics.max_pages, upperBoundPages)}`},
      { key: 'year_median_min', value: `${Math.max(yearMetrics.min_year, lowerBoundYear)}`},
      { key: 'year_median_max', value: `${Math.min(yearMetrics.max_year, upperBoundYear)}`},
    ];
  
    for (const setting of settings) {
        await setAppSettings(setting.key, setting.value);
    }
  }

  