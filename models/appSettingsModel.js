import pool from "../config/db.js";

export async function getPagesRange() {
    const [dbResult] = await pool.query(`
        SELECT
        (SELECT value FROM app_settings WHERE \`key\` = 'pages_median_min') AS pages_median_min,
        (SELECT value FROM app_settings WHERE \`key\` = 'pages_median_max') AS pages_median_max,
        (SELECT MIN(number_of_pages) FROM books) AS pages_min,
        (SELECT MAX(number_of_pages) FROM books) AS pages_max;
    `);
    return dbResult;
}

export async function getYearRange() {
    const [dbResult] = await pool.query(`
        SELECT
        (SELECT value FROM app_settings WHERE \`key\` = 'year_median_min') AS year_median_min,
        (SELECT value FROM app_settings WHERE \`key\` = 'year_median_max') AS year_median_max,
        (SELECT MIN(year_published) FROM books) AS year_min,
        (SELECT MAX(year_published) FROM books) AS year_max;
    `);
    return dbResult;
}
