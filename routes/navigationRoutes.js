import express from "express";
import { showHomepage, showProfilePage, showEditProfilePage, saveProfileChanges, updateBookScoresBasedOnLikes } from "../controllers/homeController.js";
import { showQuiz, submitQuiz } from "../controllers/quizController.js";
import { saveBook, removeBook } from "../controllers/bookController.js";
import { authenticateToken, checkQuizCompletion } from '../middleware/authMiddleware.js';
import { saveLastPage } from '../middleware/saveLastPage.js';

import en from '../locales/en.js';
import uk from '../locales/uk.js';

const router = express.Router();

router.get('/', saveLastPage, (req, res) => {
    let currentLang = req.cookies.lang || 'uk';
    const translations = currentLang === 'uk' ? uk : en;
    res.render('register', {translations, errorDB:null, errorUsername:null, errorEmail:null, data:null});
});
router.get('/login', saveLastPage, (req, res) => {
    let currentLang = req.cookies.lang || 'uk';
    const translations = currentLang === 'uk' ? uk : en;
    res.render('login', {translations, errorDB:null, errorUsername: null, errorPassword:null, data: null});
});

router.get('/home', authenticateToken, saveLastPage, checkQuizCompletion, showHomepage);
router.get('/quiz', authenticateToken, saveLastPage, showQuiz);
router.post('/quiz/submit', authenticateToken, submitQuiz);
router.post('/update-book-scores', authenticateToken, updateBookScoresBasedOnLikes);
router.get('/profile', authenticateToken, checkQuizCompletion, saveLastPage, showProfilePage);
router.get('/profile/edit', authenticateToken, checkQuizCompletion, saveLastPage, showEditProfilePage);
router.post('/profile/save-changes', authenticateToken, saveProfileChanges);
router.post('/save-book', authenticateToken, saveBook);
router.post('/remove-book', authenticateToken, removeBook);

export default router;

