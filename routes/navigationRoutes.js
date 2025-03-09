import express from "express";
import { showHomepage, showProfilePage, showEditProfilePage, saveProfileChanges, updateBookScoresBasedOnLikes } from "../controllers/homeController.js";
import { showQuiz, submitQuiz } from "../controllers/quizController.js";
import { saveBook, removeBook } from "../controllers/bookController.js";
import { authenticateToken, checkQuizCompletion } from '../middleware/authMiddleware.js';

import en from '../locales/en.js';
import uk from '../locales/uk.js';

const router = express.Router();

router.get('/', (req, res) => {
    let currentLang = req.cookies.lang || 'uk';
    const translations = currentLang === 'uk' ? uk : en;
    res.render('register', {translations, errorDB:null, errorUsername:null, errorEmail:null, data:null});
});
router.get('/login', (req, res) => {
    res.render('login', {errorDB:null, errorUsername: null, errorPassword:null, data: null});
});

router.get('/home', authenticateToken, checkQuizCompletion, showHomepage);
router.get('/quiz', authenticateToken, showQuiz);
router.post('/quiz/submit', authenticateToken, submitQuiz);
router.post('/update-book-scores', authenticateToken, updateBookScoresBasedOnLikes);
router.get('/profile', authenticateToken, checkQuizCompletion, showProfilePage);
router.get('/profile/edit', authenticateToken, checkQuizCompletion, showEditProfilePage);
router.post('/profile/save-changes', authenticateToken, saveProfileChanges);
router.post('/save-book', authenticateToken, saveBook);
router.post('/remove-book', authenticateToken, removeBook);

export default router;

