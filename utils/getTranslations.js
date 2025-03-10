import en from '../locales/en.js';
import uk from '../locales/uk.js';

export function getTranslations(req) {
    let currentLang = req.cookies.lang || 'uk';
    return currentLang === 'uk' ? uk : en;
}